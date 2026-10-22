-- WhatsApp (Baileys) storage, one row set per app user.
--
-- Heroku dynos have an ephemeral filesystem and restart at least daily, so the
-- linked-device login, scheduled reminders and message history live here
-- instead of in backend/wa/<userId>/*.json.
--
-- Access: backend only, via the service-role key (which bypasses RLS). RLS is
-- enabled with no policies, so the anon/authenticated keys shipped in the app
-- can't read these rows — `creds` and `keys` are full access to a WhatsApp
-- account. Re-running this file is safe.

-- ─── auth state ──────────────────────────────────────────────────────────────

create table if not exists public.wa_auth_creds (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  -- Baileys AuthenticationCreds, serialised with BufferJSON.
  creds       jsonb not null,
  -- Set once WhatsApp confirms pairing (creds.account present). Used to
  -- resume sessions on boot and to report "linked".
  phone       text,
  registered  boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table if not exists public.wa_auth_keys (
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- pre-key | session | sender-key | app-state-sync-key | app-state-sync-version
  -- | sender-key-memory | lid-mapping | device-list | tctoken | ...
  type        text not null,
  key_id      text not null,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, type, key_id)
);

-- ─── scheduled reminders ────────────────────────────────────────────────────

create table if not exists public.wa_schedules (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  customer_id    text not null,
  customer_name  text not null,
  phone          text not null,
  balance        numeric not null default 0,
  message        text,
  store_name     text,
  scheduled_at   timestamptz not null,
  status         text not null default 'PENDING'
                 check (status in ('PENDING', 'SENT', 'CANCELLED', 'FAILED')),
  error          text,
  sent_at        timestamptz,
  created_at     timestamptz not null default now()
);

-- The scheduler polls this every 30s.
create index if not exists wa_schedules_due_idx
  on public.wa_schedules (scheduled_at) where status = 'PENDING';
create index if not exists wa_schedules_user_idx
  on public.wa_schedules (user_id, created_at desc);

-- ─── message history ────────────────────────────────────────────────────────

create table if not exists public.wa_messages (
  user_id     uuid not null references auth.users(id) on delete cascade,
  jid         text not null,
  id          text not null,
  text        text not null,
  from_me     boolean not null,
  ts          bigint not null,  -- unix seconds
  primary key (user_id, jid, id)
);

create index if not exists wa_messages_chat_idx
  on public.wa_messages (user_id, jid, ts desc);

-- ─── lock down ──────────────────────────────────────────────────────────────

alter table public.wa_auth_creds enable row level security;
alter table public.wa_auth_keys  enable row level security;
alter table public.wa_schedules  enable row level security;
alter table public.wa_messages   enable row level security;

revoke all on public.wa_auth_creds, public.wa_auth_keys, public.wa_schedules, public.wa_messages
  from anon, authenticated;
