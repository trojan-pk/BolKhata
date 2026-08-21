-- =========================================================
-- BolKhata Multi-Tenant Database Schema (v2)
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================

-- 1. STORES / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name TEXT NOT NULL DEFAULT 'Bismillah General Store',
    owner_name TEXT NOT NULL DEFAULT 'Muhammad Salman',
    phone TEXT DEFAULT '+92 300 1234567',
    currency TEXT DEFAULT 'Rs',
    language TEXT DEFAULT 'roman_ur',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CUSTOMERS / PARTIES TABLE (Scoped to Store & User)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    type TEXT DEFAULT 'customer' CHECK (type IN ('customer', 'supplier')),
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TRANSACTIONS (Udhaar & Jama Entries)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('gave', 'got')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    note TEXT,
    payment_mode TEXT DEFAULT 'cash',
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CASHBOOK (Daily Inflow & Expense Rokar)
CREATE TABLE IF NOT EXISTS public.cashbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    note TEXT,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashbook_user_id ON public.cashbook(user_id);

-- 6. MULTI-TENANT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on cashbook" ON public.cashbook FOR ALL USING (true) WITH CHECK (true);

-- 7. Insert Initial Store & Sample Customers
INSERT INTO public.stores (id, user_id, name, owner_name, phone, currency, language)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Bismillah General Store', 'Muhammad Salman', '+92 300 1234567', 'Rs', 'roman_ur')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (id, store_id, user_id, name, phone, address, type, balance)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Ramesh Kumar (Grocery)', '+92 300 1234567', 'Shop #12, Main Market', 'customer', 4500),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Sunita Devi', '+92 301 9876543', 'House 44, Civil Lines', 'customer', 1850),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Amrit Rice Supplier', '+92 321 4455667', 'Grain Market Yard', 'supplier', -3200)
ON CONFLICT (id) DO NOTHING;
