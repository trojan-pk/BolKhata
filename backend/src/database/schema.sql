-- =========================================================
-- BolKhata Complete Supabase Database Schema
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================

-- 1. Create Customers / Parties Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    type TEXT DEFAULT 'customer' CHECK (type IN ('customer', 'supplier')),
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Transactions (Udhaar / Jama) Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('gave', 'got', 'CREDIT', 'PAYMENT')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT,
    payment_mode TEXT DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Cashbook (Rokar) Table
CREATE TABLE IF NOT EXISTS public.cashbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    note TEXT,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (Public Access for BolKhata)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on cashbook" ON public.cashbook FOR ALL USING (true) WITH CHECK (true);

-- 5. Insert Sample Store Customers
INSERT INTO public.customers (name, phone, address, type, balance)
VALUES 
  ('Ramesh Kumar (Grocery)', '+92 300 1234567', 'Shop #12, Main Market', 'customer', 4500),
  ('Sunita Devi', '+92 301 9876543', 'House 44, Civil Lines', 'customer', 1850),
  ('Amrit Rice Supplier', '+92 321 4455667', 'Grain Market Yard', 'supplier', -3200)
ON CONFLICT DO NOTHING;
