# BolKhata Technical Stack and Data Architecture

## 1. Production Technical Stack

### Mobile & Web Frontend
- **Framework**: **React Native 0.88.0** on **Expo SDK ~58.0.0** (Managed Workflow with clean EAS prebuilds).
- **Web Engine**: **React Native Web 0.21.0** on **React 19.3.0** and `@expo/metro-runtime`.
- **Language**: **TypeScript ~6.0.3** in strict mode (extending `expo/tsconfig.base`).
- **Authentication**: **Supabase Auth** (`@supabase/supabase-js ^2.112.3`) with PKCE deep links (`bolkhata://`, `veldger://`) and token cache via `@react-native-async-storage/async-storage`.
- **Audio Capture & Playback**: `expo-audio` for audio recording; native speech synthesis via `expo-speech` with DashScope/ElevenLabs TTS audio stream playback.
- **UI & Design Tokens**: Handcrafted design system in `src/ui` (Button, Card, Money, Row, Sheet, Chip, EmptyState, Feedback toast), `lucide-react-native` icons, and custom SVG primitives.
- **Typography**: Plus Jakarta Sans (figures & headings) and Inter (body) injected dynamically on web with native system font fallbacks.

### Backend API Server
- **Runtime**: **Node.js 22 LTS** (`engines: { node: "22.x", npm: "10.x" }`).
- **Framework**: **Express 5.2.1** (`type: "commonjs"`).
- **Database & Auth**: `@supabase/supabase-js ^2.112.3` with service role admin privileges.
- **WhatsApp Web Integration**: **Baileys v7** (`@whiskeysockets/baileys ^7.0.0-rc14`) with custom dynamic ESM loader and `AliAryanTech/libsignal-node` override.
- **File Uploads**: `multer ^2.2.0` (in-memory storage) for processing multipart voice recordings.
- **QR Code Generation**: `qr-image ^3.2.0` for converting WhatsApp pairing codes to PNG buffers for SSE transmission.
- **Validation**: `zod ^4.4.3` for schema and input validation.

---

## 2. Multi-Tenant Database Architecture (`schema_v2.sql`)

BolKhata's relational data store is hosted on Supabase PostgreSQL. Multi-tenancy is enforced through `user_id` and `store_id` relational constraints and Row Level Security (RLS).

```text
┌────────────────┐       1:N       ┌────────────────┐       1:N       ┌────────────────┐
│     stores     ├─────────────────┤   customers    ├─────────────────┤  transactions  │
├────────────────┤                 ├────────────────┤                 ├────────────────┤
│ id (PK, UUID)  │                 │ id (PK, UUID)  │                 │ id (PK, UUID)  │
│ user_id (UUID) │                 │ store_id (FK)  │                 │ store_id (FK)  │
│ name           │                 │ user_id (UUID) │                 │ customer_id(FK)│
│ owner_name     │                 │ name           │                 │ type (gave/got)│
│ phone          │                 │ phone          │                 │ amount         │
│ currency       │                 │ address        │                 │ note           │
│ language       │                 │ type (cust/sup)│                 │ payment_mode   │
│ created_at     │                 │ balance        │                 │ date           │
└────────────────┘                 │ created_at     │                 │ created_at     │
        │                          └────────────────┘                 └────────────────┘
        │ 1:N
┌───────┴────────┐
│    cashbook    │
├────────────────┤
│ id (PK, UUID)  │
│ store_id (FK)  │
│ user_id (UUID) │
│ type (in/out)  │
│ amount         │
│ category       │
│ note           │
│ date           │
│ created_at     │
└────────────────┘
```

### Table Definitions

#### 1. `stores`
Stores profile settings for each shopkeeper account:
- `id`: Unique store UUID (`gen_random_uuid()`).
- `user_id`: Authenticated Supabase user UUID.
- `name`: Store business name (e.g. "Madina General Store").
- `owner_name`: Shopkeeper's personal name.
- `phone`: Store contact phone number.
- `currency`: Default currency symbol (e.g. `Rs`).
- `language`: Selected UI & voice language (e.g. `roman_ur`).

#### 2. `customers`
Parties associated with the store ledger:
- `id`: Customer UUID.
- `store_id`: Associated store foreign key.
- `user_id`: Owning user UUID for direct tenant isolation.
- `name`: Party name (normalized to Roman TitleCase).
- `phone`: Mobile phone number for WhatsApp payment reminders.
- `address`: Physical location or address details.
- `type`: `customer` (buyer) or `supplier` (wholesaler).
- `balance`: Authoritative running balance.

#### 3. `transactions`
Immutable ledger records for credit and payment events:
- `id`: Transaction UUID.
- `store_id`: Store foreign key.
- `customer_id`: Party foreign key with cascading delete.
- `type`: `gave` (Udhaar given / Debit) or `got` (Jama / Payment received / Credit).
- `amount`: Transaction amount ($> 0$).
- `note`: Description or purpose of the purchase (e.g. "saman", "petrol", "ghee").
- `payment_mode`: `cash`, `online`, or `bank_transfer`.
- `date`: Transaction calendar date (`YYYY-MM-DD`).

#### 4. `cashbook`
Daily shop cash flow (Rokar):
- `id`: Cashbook entry UUID.
- `store_id`: Store foreign key.
- `user_id`: User UUID.
- `type`: `in` (cash sales/receipts) or `out` (expenses/payouts).
- `amount`: Cash amount ($> 0$).
- `category`: Classification (e.g. "Sales", "Inventory", "Utilities", "Tea/Food").
- `note`: Context notes.

### Performance Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashbook_user_id ON public.cashbook(user_id);
```

---

## 3. Offline-First Client Architecture (`StorageService`)

To ensure shopkeepers can record sales even during connectivity drops, `frontend/src/services/storage.ts` maintains a local-first caching layer backed by `@react-native-async-storage/async-storage`:

1. **User-Scoped Isolation**:
   ```typescript
   const userKey = (baseKey: string, userId?: string) =>
     userId ? `${baseKey}_${userId}` : baseKey;
   ```
2. **Read Strategy**:
   - First attempts to load authenticated records from Supabase cloud.
   - Automatically caches the retrieved dataset in user-scoped `AsyncStorage`.
   - If offline or cloud query fails, seamlessly falls back to the local `AsyncStorage` cache.
3. **Write Strategy**:
   - Updates local state and commits to `AsyncStorage` immediately for zero UI latency.
   - Asynchronously synchronizes changes to Supabase PostgreSQL when online.

---

## 4. Voice & AI Processing Pipeline

1. **Audio Recording**:
   - Captured via `expo-audio` at 16kHz/44.1kHz sample rate.
   - Formatted as `audio/m4a` on native iOS/Android or `audio/webm` on web.
2. **Speech-to-Text (STT)**:
   - Primary: Groq `whisper-large-v3` (sub-second transcription with multilingual Urdu/Hindi capability).
   - Secondary Fallback: ElevenLabs Scribe API.
3. **Intent Parsing & Normalization**:
   - Primary: Groq `llama3-8b-8192` with strict JSON schema mode.
   - Secondary Fallback: Google Gemini 1.5 / 2.0 Flash or Alibaba DashScope Qwen.
   - Extracts intent (`create_transaction`, `update_transaction`, `delete_transaction`, `delete_customer`, `get_balance`), direction (`gave`/`got`), numeric amount, person name, and date.
4. **Fuzzy Customer Matching**:
   - Backend runs a Levenshtein distance matching algorithm against all party names in the user's ledger to prevent duplicate entries caused by alternate phonetic spellings.
5. **Text-to-Speech Confirmation (TTS)**:
   - Generated via Alibaba DashScope `qwen3-tts-flash` or ElevenLabs, delivered as a base64-encoded WAV audio string alongside the JSON payload.
