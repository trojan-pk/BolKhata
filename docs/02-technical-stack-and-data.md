# BolKhata Technical Stack & Data Architecture

## 1. Complete Technology Stack

### Frontend Application (`/frontend`)
- **Framework**: React Native 0.81.5 with Expo SDK 54 (Managed Workflow)
- **Web Runtime**: React 19.1.0 (`react-dom: 19.1.0`, `@expo/metro-runtime: ~6.1.2`, `react-native-web: ^0.21.0`)
- **Authentication**: `@supabase/supabase-js: ^2.112.3` with deep link PKCE & hash exchange (`expo-linking: ~8.0.12`, `expo-web-browser: ~15.0.11`)
- **Local Persistence**: `@react-native-async-storage/async-storage: 2.2.0` (Scoped by `user_id`)
- **Audio & Media**: `expo-audio: ~1.1.1`, `expo-speech: ~14.0.7`
- **UI & Icons**: Custom atomic design system (`src/ui`), `lucide-react-native: ^0.475.0`, `react-native-svg: 15.12.1`
- **Typography**: Google Fonts via CSS preconnect / web font loader (**Plus Jakarta Sans** and **Inter**)

### Backend Server (`/backend`)
- **Runtime**: Node.js v20+ with Express 5.2.1 and TypeScript (`tsx: ^4.23.12`, `typescript: ^7.0.2`)
- **Database & Auth**: Supabase PostgreSQL with Schema v3, RLS, and `@supabase/supabase-js: ^2.112.3`
- **WhatsApp Engine**: `baileys: ^7.0.0-rc14` with `@hapi/boom: ^10.0.1` and `qr-image: ^3.2.0`
- **Validation & Parsing**: `zod: ^4.4.3`, `multer: ^2.2.0`
- **AI Integrations**:
  - Google Generative AI REST API (Gemini Flash Lite)
  - Alibaba Cloud DashScope REST API (Qwen Turbo)
  - Groq Cloud REST API (Whisper Large v3 Turbo & Llama 3.3 70B)
  - ElevenLabs REST API (Scribe STT & Multilingual TTS)

---

## 2. Multi-Tenant Database Schema (Schema v3)

The single source of truth migration is located at `backend/supabase/migrations/20260901000000_unified_schema_v3.sql`.

```sql
-- =========================================================
-- BolKhata Multi-Tenant Production Schema (Supabase PostgreSQL v3)
-- =========================================================

-- 1. STORES / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'My Store',
    owner_name TEXT NOT NULL DEFAULT 'Shopkeeper',
    phone TEXT,
    currency TEXT DEFAULT 'Rs',
    language TEXT DEFAULT 'roman_ur',
    account_type TEXT DEFAULT 'commercial',
    business_category TEXT DEFAULT 'General Store',
    is_onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CUSTOMERS / PARTIES TABLE (Scoped to Store & User)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    type TEXT DEFAULT 'customer' CHECK (type IN ('customer', 'supplier')),
    -- Maintained exclusively by trg_transactions_recalc_balance
    balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TRANSACTIONS TABLE (Udhaar & Jama Entries)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                    -- derived from customer by trigger
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    party_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('gave', 'got')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    note TEXT,
    payment_mode TEXT DEFAULT 'cash',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CASHBOOK TABLE (Daily Inflow & Expense Rokar)
CREATE TABLE IF NOT EXISTS public.cashbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    note TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. DAILY VOICE QUOTA TABLE
CREATE TABLE IF NOT EXISTS public.voice_usage (
    user_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_updated ON public.customers(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cashbook_user_id ON public.cashbook(user_id);

-- 7. ROW LEVEL SECURITY (RLS) - Enforced per-user isolation
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_select_own" ON public.stores FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "stores_insert_own" ON public.stores FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "stores_update_own" ON public.stores FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "stores_delete_own" ON public.stores FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "customers_select_own" ON public.customers FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "customers_insert_own" ON public.customers FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "customers_update_own" ON public.customers FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "customers_delete_own" ON public.customers FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "transactions_update_own" ON public.transactions FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "transactions_delete_own" ON public.transactions FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "cashbook_select_own" ON public.cashbook FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "cashbook_insert_own" ON public.cashbook FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "cashbook_update_own" ON public.cashbook FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "cashbook_delete_own" ON public.cashbook FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "voice_usage_select_own" ON public.voice_usage FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 8. TENANCY TRIGGER: Derive transaction user_id from customer
CREATE OR REPLACE FUNCTION public.derive_transaction_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
    SELECT user_id INTO NEW.user_id FROM public.customers WHERE id = NEW.customer_id;
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'customer_id % not found for this user', NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transactions_derive_user
    BEFORE INSERT OR UPDATE OF customer_id ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.derive_transaction_user_id();

-- 9. BALANCE TRIGGER: Authoritative recalculation on ledger mutation
CREATE OR REPLACE FUNCTION public.recalc_customer_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
    v_customer UUID := COALESCE(NEW.customer_id, OLD.customer_id);
BEGIN
    UPDATE public.customers c
    SET balance = COALESCE((
            SELECT SUM(CASE WHEN t.type = 'gave' THEN t.amount ELSE -t.amount END)
            FROM public.transactions t
            WHERE t.customer_id = v_customer
        ), 0),
        updated_at = NOW()
    WHERE c.id = v_customer;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_transactions_recalc_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.recalc_customer_balance();

-- 10. VOICE QUOTA RPC: Atomic daily usage counter
CREATE OR REPLACE FUNCTION public.increment_voice_usage(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF CURRENT_SETTING('role', true) <> 'service_role'
       AND (SELECT auth.uid()) IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'voice usage can only be incremented for the calling user';
    END IF;

    INSERT INTO public.voice_usage (user_id, date, count)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET count = public.voice_usage.count + 1
    RETURNING count INTO v_count;

    RETURN jsonb_build_object('allowed', v_count <= p_limit, 'count', v_count, 'limit', p_limit);
END;
$$;
```

---

## 3. Authentication & Session Architecture

BolKhata uses **Supabase Auth** with local storage session persistence:

1. **Client Setup**:
   ```typescript
   export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
     auth: {
       storage: AsyncStorage,
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: Platform.OS === 'web',
     },
   });
   ```

2. **Supported Authentication Methods**:
   - **Email / Password**: Signup with email verification and instant login.
   - **Google OAuth**: One-tap sign-in with web redirect and native deep linking (`Linking.createURL('/')`).
   - **Deep Link Handling**: Supports both PKCE auth code exchange (`supabase.auth.exchangeCodeForSession`) and implicit token hash parsing (`access_token` and `refresh_token`).

3. **Per-User Local Isolation**:
   To prevent account data bleeding on shared devices, `StorageService` namespaces AsyncStorage keys by user ID:
   ```typescript
   const userKey = (baseKey: string, userId?: string) =>
     userId ? `${baseKey}_${userId}` : baseKey;
   ```

---

## 4. Authoritative Ledger Calculation Engine

```typescript
export function balanceFor(transactions: Transaction[], partyId: string): number {
  return transactions
    .filter((t) => t.partyId === partyId)
    .reduce((sum, t) => sum + (t.type === 'gave' ? t.amount : -t.amount), 0);
}

export function withRecalculatedBalance(
  parties: Party[],
  transactions: Transaction[],
  partyId: string,
  date = todayISO()
): Party[] {
  const balance = balanceFor(transactions, partyId);
  return parties.map((p) =>
    p.id === partyId ? { ...p, currentBalance: balance, lastUpdated: date } : p
  );
}
```
- **Opening Balances** are stored as true initial transactions (`type: 'gave'` or `'got'`) with `note: 'Opening balance'` so they are fully auditable and survive retroactive edits.
