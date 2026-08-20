-- Schema for BolKhata Backend

-- Create users table (Extends Supabase auth.users or stands alone depending on strategy)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table (Shopkeeper's customers)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('CREDIT', 'PAYMENT')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  ai_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  amount_due NUMERIC NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
