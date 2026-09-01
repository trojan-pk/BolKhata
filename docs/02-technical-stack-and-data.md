# BolKhata Technical Stack & Data Architecture

## 1. Complete Technology Stack

### Frontend Application (`/frontend`)
- **Framework**: React Native 0.81.5 with Expo SDK 54 (Managed Workflow)
- **Web Runtime**: React 19.1.0 (`react-dom: 19.1.0`, `@expo/metro-runtime: ~6.1.2`, `react-native-web: ^0.21.0`)
- **Authentication**: `@supabase/supabase-js: ^2.112.3` with deep link PKCE & hash exchange (`expo-linking: ~8.0.12`, `expo-web-browser: ~15.0.11`)
- **Local Persistence**: `@react-native-async-storage/async-storage: 2.2.0` (Scoped by `user_id`)
- **Audio & Media**: `expo-av: ~16.0.8`, `expo-speech: ~14.0.7`
- **UI & Icons**: Custom atomic design system (`src/ui`), `lucide-react-native: ^0.475.0`, `react-native-svg: 15.12.1`
- **Typography**: Google Fonts via CSS preconnect / web font loader (**Plus Jakarta Sans** and **Inter**)

### Backend Server (`/backend`)
- **Runtime**: Node.js v20+ with Express 5.2.1 and TypeScript (`tsx: ^4.23.12`, `typescript: ^7.0.2`)
- **Database & Auth**: Supabase PostgreSQL with Schema v2, RLS, and `@supabase/supabase-js: ^2.112.3`
- **WhatsApp Engine**: `baileys: ^7.0.0-rc14` with `@hapi/boom: ^10.0.1` and `qr-image: ^3.2.0`
- **Validation & Parsing**: `zod: ^4.4.3`, `multer: ^2.2.0`
- **AI Integrations**:
  - Google Generative AI REST API (Gemini Flash Lite)
  - Alibaba Cloud DashScope REST API (Qwen Turbo)
  - Groq Cloud REST API (Whisper Large v3 Turbo & Llama 3.3 70B)
  - ElevenLabs REST API (Scribe STT & Multilingual TTS)

---

## 2. Multi-Tenant Database Schema (Schema v2)

```sql
-- =========================================================
-- BolKhata Multi-Tenant Production Schema (Supabase PostgreSQL)
-- =========================================================

-- 1. STORES / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name TEXT NOT NULL DEFAULT 'My Store',
    owner_name TEXT NOT NULL DEFAULT 'Shopkeeper',
    phone TEXT,
    currency TEXT DEFAULT 'Rs',
    language TEXT DEFAULT 'roman_ur',
    account_type TEXT DEFAULT 'commercial',
    business_category TEXT DEFAULT 'General Store',
    is_onboarded BOOLEAN DEFAULT false,
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

-- 3. TRANSACTIONS TABLE (Udhaar & Jama Entries)
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

-- 4. CASHBOOK TABLE (Daily Inflow & Expense Rokar)
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

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on cashbook" ON public.cashbook FOR ALL USING (true) WITH CHECK (true);
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
