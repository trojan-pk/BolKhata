-- ============================================================================
-- BolKhata Unified Schema v3 — multi-tenant ledger with enforced RLS
-- ============================================================================
-- Idempotent: safe to run on a FRESH database and on databases created from
-- the legacy schema.sql / schema_v2.sql files (legacy rows are migrated).
--
-- Run in Supabase Dashboard → SQL Editor, or via the Supabase CLI:
--   supabase db push   (with supabase/migrations/ wired to a linked project)
--
-- Key guarantees:
--   1. Every table carries user_id and RLS restricts all access to
--      `auth.uid() = user_id` for the anon/authenticated roles.
--   2. transactions.user_id is DERIVED from the owning customer by trigger,
--      so a row can never be attached across tenants.
--   3. customers.balance is recomputed from the transaction history by
--      trigger on every insert/update/delete — one source of truth.
--   4. voice_usage is writable only through increment_voice_usage().
-- ============================================================================

-- ============================================================ 1. TABLES ====

create table if not exists public.stores (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    name text not null default 'My Store',
    owner_name text not null default 'Shopkeeper',
    phone text,
    currency text default 'Rs',
    language text default 'roman_ur',
    account_type text default 'commercial',
    business_category text default 'General Store',
    is_onboarded boolean default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default '00000000-0000-0000-0000-000000000000',
    store_id uuid references public.stores(id) on delete set null,
    name text not null,
    phone text,
    address text,
    type text default 'customer' check (type in ('customer', 'supplier')),
    -- Maintained exclusively by trg_transactions_recalc_balance.
    balance numeric not null default 0,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,                    -- derived from customer by trigger
    store_id uuid references public.stores(id) on delete set null,
    customer_id uuid not null references public.customers(id) on delete cascade,
    party_name text,                          -- denormalized display cache
    type text not null check (type in ('gave', 'got')),
    amount numeric not null check (amount > 0),
    note text,
    payment_mode text default 'cash',
    date date not null default current_date,
    source text default 'manual',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cashbook (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default '00000000-0000-0000-0000-000000000000',
    store_id uuid references public.stores(id) on delete set null,
    type text not null check (type in ('in', 'out')),
    amount numeric not null check (amount > 0),
    category text not null,
    note text,
    date date not null default current_date,
    created_at timestamptz not null default timezone('utc', now())
);

-- Daily voice-request quota per user. Written only via increment_voice_usage.
create table if not exists public.voice_usage (
    user_id uuid not null,
    date date not null default current_date,
    count integer not null default 0,
    primary key (user_id, date)
);

-- ============================================== 2. LEGACY → v3 MIGRATION ====
-- No-ops on fresh databases; repair older deployments.

alter table public.stores
    add column if not exists account_type text default 'commercial',
    add column if not exists business_category text default 'General Store',
    add column if not exists is_onboarded boolean default false,
    add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.customers
    add column if not exists user_id uuid not null default '00000000-0000-0000-0000-000000000000',
    add column if not exists store_id uuid,
    add column if not exists address text,
    add column if not exists type text default 'customer',
    add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.transactions
    add column if not exists user_id uuid,
    add column if not exists store_id uuid,
    add column if not exists party_name text,
    add column if not exists note text,
    add column if not exists payment_mode text default 'cash',
    add column if not exists date date default current_date,
    add column if not exists source text default 'manual',
    add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.cashbook
    add column if not exists user_id uuid not null default '00000000-0000-0000-0000-000000000000',
    add column if not exists store_id uuid;

-- transactions.party_id (legacy) → customer_id
do $$
begin
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'transactions' and column_name = 'party_id')
       and not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'transactions' and column_name = 'customer_id') then
        alter table public.transactions rename column party_id to customer_id;
    end if;
end $$;

-- transactions.description (legacy) → note
do $$
begin
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'transactions' and column_name = 'description')
       and not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'transactions' and column_name = 'note') then
        alter table public.transactions rename column description to note;
    end if;
end $$;

do $$
begin
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'transactions' and column_name = 'description')
       and exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'transactions' and column_name = 'note') then
        update public.transactions set note = coalesce(note, description);
        alter table public.transactions drop column description;
    end if;
end $$;

-- Normalize legacy transaction types ('CREDIT'/'PAYMENT') to gave/got.
update public.transactions set type = lower(type) where type in ('CREDIT', 'PAYMENT');
update public.transactions set type = 'gave' where type = 'credit';
update public.transactions set type = 'got'  where type = 'payment';

-- Backfill transactions.user_id from the owning customer; orphans fall back
-- to the legacy placeholder tenant so the NOT NULL below can be applied.
update public.transactions t
set user_id = c.user_id
from public.customers c
where t.customer_id = c.id
  and t.user_id is null;

update public.transactions
set user_id = '00000000-0000-0000-0000-000000000000'
where user_id is null;

do $$
begin
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'transactions'
                 and column_name = 'user_id' and is_nullable = 'YES') then
        alter table public.transactions alter column user_id set not null;
    end if;
end $$;

-- Constraints (Postgres has no ADD CONSTRAINT IF NOT EXISTS — DO blocks).
do $$
begin
    if not exists (select 1 from pg_constraint
                   where conname = 'stores_user_id_key' and conrelid = 'public.stores'::regclass) then
        -- Keep at most one store row per user (frontend upserts on user_id).
        alter table public.stores add constraint stores_user_id_key unique (user_id);
    end if;
end $$;

do $$
begin
    if exists (select 1 from pg_constraint
               where conname = 'transactions_type_check' and conrelid = 'public.transactions'::regclass) then
        alter table public.transactions drop constraint transactions_type_check;
    end if;
    alter table public.transactions
        add constraint transactions_type_check check (type in ('gave', 'got'));
end $$;

do $$
begin
    if exists (select 1 from pg_constraint
               where conname = 'transactions_party_id_fkey' and conrelid = 'public.transactions'::regclass) then
        alter table public.transactions drop constraint transactions_party_id_fkey;
    end if;

    if not exists (select 1 from pg_constraint
                   where conname = 'transactions_customer_id_fkey' and conrelid = 'public.transactions'::regclass) then
        alter table public.transactions
            add constraint transactions_customer_id_fkey
            foreign key (customer_id) references public.customers(id) on delete cascade;
    end if;
end $$;

-- store_id FKs use ON DELETE SET NULL (legacy CASCADE would wipe a whole
-- ledger if a store row ever disappeared).
do $$
begin
    if exists (select 1 from pg_constraint
               where conname = 'customers_store_id_fkey' and conrelid = 'public.customers'::regclass) then
        alter table public.customers drop constraint customers_store_id_fkey;
    end if;
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'customers' and column_name = 'store_id') then
        alter table public.customers
            add constraint customers_store_id_fkey
            foreign key (store_id) references public.stores(id) on delete set null;
    end if;

    if exists (select 1 from pg_constraint
               where conname = 'transactions_store_id_fkey' and conrelid = 'public.transactions'::regclass) then
        alter table public.transactions drop constraint transactions_store_id_fkey;
    end if;
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'transactions' and column_name = 'store_id') then
        alter table public.transactions
            add constraint transactions_store_id_fkey
            foreign key (store_id) references public.stores(id) on delete set null;
    end if;

    if exists (select 1 from pg_constraint
               where conname = 'cashbook_store_id_fkey' and conrelid = 'public.cashbook'::regclass) then
        alter table public.cashbook drop constraint cashbook_store_id_fkey;
    end if;
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'cashbook' and column_name = 'store_id') then
        alter table public.cashbook
            add constraint cashbook_store_id_fkey
            foreign key (store_id) references public.stores(id) on delete set null;
    end if;
end $$;

-- ============================================================ 3. INDEXES ====

create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_customers_user_updated on public.customers(user_id, updated_at desc);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_customer_id on public.transactions(customer_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_cashbook_user_id on public.cashbook(user_id);
-- stores(user_id) is covered by the unique constraint's index.

-- ============================================================== 4. RLS =====
-- Enable RLS everywhere, drop the legacy "Allow public all access" policies,
-- then create real per-user policies. `(select auth.uid())` is wrapped so the
-- value is cached per statement instead of evaluated per row.

alter table public.stores      enable row level security;
alter table public.customers   enable row level security;
alter table public.transactions enable row level security;
alter table public.cashbook    enable row level security;
alter table public.voice_usage enable row level security;

-- Legacy permissive policies from schema.sql / schema_v2.sql — must go.
drop policy if exists "Allow public all access on stores" on public.stores;
drop policy if exists "Allow public all access on customers" on public.customers;
drop policy if exists "Allow public all access on transactions" on public.transactions;
drop policy if exists "Allow public all access on cashbook" on public.cashbook;

-- stores
drop policy if exists "stores_select_own" on public.stores;
drop policy if exists "stores_insert_own" on public.stores;
drop policy if exists "stores_update_own" on public.stores;
drop policy if exists "stores_delete_own" on public.stores;
create policy "stores_select_own" on public.stores for select to authenticated using ((select auth.uid()) = user_id);
create policy "stores_insert_own" on public.stores for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "stores_update_own" on public.stores for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "stores_delete_own" on public.stores for delete to authenticated using ((select auth.uid()) = user_id);

-- customers
drop policy if exists "customers_select_own" on public.customers;
drop policy if exists "customers_insert_own" on public.customers;
drop policy if exists "customers_update_own" on public.customers;
drop policy if exists "customers_delete_own" on public.customers;
create policy "customers_select_own" on public.customers for select to authenticated using ((select auth.uid()) = user_id);
create policy "customers_insert_own" on public.customers for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "customers_update_own" on public.customers for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customers_delete_own" on public.customers for delete to authenticated using ((select auth.uid()) = user_id);

-- transactions
drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_select_own" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions_update_own" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_delete_own" on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);

-- cashbook
drop policy if exists "cashbook_select_own" on public.cashbook;
drop policy if exists "cashbook_insert_own" on public.cashbook;
drop policy if exists "cashbook_update_own" on public.cashbook;
drop policy if exists "cashbook_delete_own" on public.cashbook;
create policy "cashbook_select_own" on public.cashbook for select to authenticated using ((select auth.uid()) = user_id);
create policy "cashbook_insert_own" on public.cashbook for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cashbook_update_own" on public.cashbook for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "cashbook_delete_own" on public.cashbook for delete to authenticated using ((select auth.uid()) = user_id);

-- voice_usage: read your own counter; writes only via the RPC below.
drop policy if exists "voice_usage_select_own" on public.voice_usage;
create policy "voice_usage_select_own" on public.voice_usage for select to authenticated using ((select auth.uid()) = user_id);

-- ============================================ 5. TENANCY & BALANCE LOGIC ====

-- Derive transactions.user_id from the owning customer BEFORE the row is
-- written. Under RLS the subselect only sees the caller's own customers, so
-- pointing a transaction at another tenant's customer fails outright.
create or replace function public.derive_transaction_user_id()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    select user_id into new.user_id from public.customers where id = new.customer_id;
    if new.user_id is null then
        raise exception 'customer_id % not found for this user', new.customer_id;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_transactions_derive_user on public.transactions;
create trigger trg_transactions_derive_user
    before insert or update of customer_id on public.transactions
    for each row execute function public.derive_transaction_user_id();

-- Single source of truth for balances: recompute customers.balance from the
-- full transaction history whenever the ledger changes. Idempotent under
-- concurrency because each recompute reads the committed sum.
create or replace function public.recalc_customer_balance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_customer text := coalesce(new.customer_id, old.customer_id)::text;
begin
    update public.customers c
    set balance = coalesce((
            select sum(case when t.type = 'gave' then t.amount else -t.amount end)
            from public.transactions t
            where t.customer_id::text = v_customer
        ), 0),
        updated_at = now()
    where c.id::text = v_customer;
    return null;
end;
$$;

drop trigger if exists trg_transactions_recalc_balance on public.transactions;
create trigger trg_transactions_recalc_balance
    after insert or update or delete on public.transactions
    for each row execute function public.recalc_customer_balance();

-- Reconcile existing balances once the trigger is in place.
update public.customers c
set balance = coalesce((
        select sum(case when t.type = 'gave' then t.amount else -t.amount end)
        from public.transactions t
        where t.customer_id = c.id
    ), 0);

-- ==================================================== 6. VOICE QUOTA RPC ====

-- Atomic daily-usage increment. Callable by the backend (service_role) or by
-- a user for their own id; anything else raises. SECURITY DEFINER is required
-- because callers have no direct write policy on voice_usage.
create or replace function public.increment_voice_usage(p_user_id uuid, p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_count integer;
begin
    if current_setting('role', true) <> 'service_role'
       and (select auth.uid()) is distinct from p_user_id then
        raise exception 'voice usage can only be incremented for the calling user';
    end if;

    insert into public.voice_usage (user_id, date, count)
    values (p_user_id, current_date, 1)
    on conflict (user_id, date)
    do update set count = public.voice_usage.count + 1
    returning count into v_count;

    return jsonb_build_object('allowed', v_count <= p_limit, 'count', v_count, 'limit', p_limit);
end;
$$;

revoke execute on function public.increment_voice_usage(uuid, integer) from PUBLIC, anon;
grant execute on function public.increment_voice_usage(uuid, integer) to authenticated, service_role;

-- ============================================ 7. DATA API VISIBILITY ========
-- Ensure the tables are exposed to PostgREST for the anon/authenticated roles
-- (RLS above decides which rows each role can actually see).

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.stores, public.customers, public.transactions, public.cashbook to authenticated;
grant select on public.voice_usage to authenticated;
