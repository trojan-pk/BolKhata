# BolKhata (بول کھاتا / बोल खाता) — Voice-First Digital Ledger

**BolKhata** is an AI-powered voice-first digital ledger and shop management app designed specifically for retail store owners and small shopkeepers in South Asia. The shopkeeper **speaks** transactions in natural Urdu, Roman Urdu, Hindi, or English. BolKhata transcribes the voice input, uses large language models (LLMs) to extract structured financial intents, generates a spoken audio confirmation, and commits the entry to a multi-tenant digital *khata* with real-time running balance reconciliation.

BolKhata also features automated and scheduled **WhatsApp payment reminders** via a native WhatsApp Web integration (Baileys v7), reducing awkward payment recovery conversations and improving cash flow.

Built for the **Alibaba Cloud AI Hackathon Pakistan 2026** (Alkhidmat Foundation Pakistan / Bano Qabil ecosystem). Team: **Trojan**.

> **Core Value Prop**: 1-tap/hold voice entry via bottom dock, animated waveform HUD, spoken confirmation in shopkeeper's language, offline-first reliability with Supabase sync, and direct WhatsApp payment reminders.

---

## 🎯 Core Flow

```text
🎙️  "Ahmed ne 500 ka saman udhaar liya"
         │
         ├─ Bottom dock mic button (tap or hold-and-release)
         ├─ expo-av records mic → audio file (m4a / webm)
         ▼
   POST /voice/process  (multipart audio, Bearer token auth)
         │
         ├─ STT: Groq Whisper large-v3 (with ElevenLabs Scribe fallback)
         ├─ Intent Parser: Groq Llama 3 / Gemini / Qwen (JSON schema: Gave/Got, Amount, Person)
         ├─ Levenshtein Fuzzy Matcher: resolves names against store customer ledger
         ├─ TTS: DashScope qwen3-tts-flash / ElevenLabs → spoken confirmation wav (base64)
         ▼
   VoiceAssistantModal opens: Displays parsed transaction + plays spoken confirmation
         │
   Shopkeeper reviews & taps "Confirm"
         │
         ├─ Immutably recalculates customer balance
         ├─ Saves locally to AsyncStorage (user-scoped)
         ▼
   Synced to Supabase PostgreSQL (multi-tenant RLS)
         │
   (Optional) Send polite WhatsApp payment reminder / schedule reminder
```

---

## 📂 Repository Structure (Monorepo)

```
BolKhata/
├── frontend/                       # React Native app — Expo SDK 54 / React 19
│   ├── App.tsx                     # App bootstrap, Supabase auth gate, routing, modals, ledger math
│   ├── index.ts                    # Application root entry point
│   ├── app.json                    # Expo config (version 1.1.0, slug: bolkhata, scheme: bolkhata/veldger)
│   ├── eas.json                    # EAS Build profiles (Node 22, Android latest image, APK preview)
│   ├── babel.config.js             # Babel plugins & Lucide barrel-import rewrite
│   ├── tsconfig.json               # TypeScript config (extends expo/tsconfig.base)
│   ├── .easignore                  # EAS build ignore (excludes native android/ios folders and locks)
│   └── src/
│       ├── components/             # Reusable UI components & modals
│       │   ├── AppBar.tsx          # Top navigation bar with store avatar and settings trigger
│       │   ├── TabBar.tsx          # Floating bottom dock with center pulse voice action button
│       │   ├── VoiceRecordingHUD.tsx # Animated recording overlay (duration, pulse, cancel/stop)
│       │   ├── VoiceAssistantModal.tsx # Spoken confirmation review modal with intent execution
│       │   ├── VoiceLogo.tsx       # 5-bar animated voice equalizer icon
│       │   ├── BalanceCard.tsx     # Net Khata balance, total receivable (Gave) & payable (Got)
│       │   ├── CustomerCard.tsx    # Customer list item with colored balance badges
│       │   ├── CustomerLedgerPanel.tsx # Customer transaction history timeline & WhatsApp CTAs
│       │   ├── TransactionModal.tsx # Manual transaction entry modal (Gave / Got)
│       │   ├── EditTransactionModal.tsx # Transaction update modal
│       │   ├── AddCustomerModal.tsx # New party registration modal (Customer / Supplier)
│       │   ├── EditCustomerModal.tsx # Customer details edit modal
│       │   ├── WhatsAppLinkModal.tsx # QR code scanner modal for linking WhatsApp via SSE
│       │   ├── WaTemplateModal.tsx # Pre-built polite WhatsApp reminder templates
│       │   ├── WaScheduleModal.tsx # Schedule future WhatsApp reminder modal
│       │   ├── WaMarkdownPreview.tsx # Live preview of WhatsApp formatting (*bold*, _italic_)
│       │   ├── SplashScreen.tsx    # Branded splash screen with animated letter reveal
│       │   ├── SetupCelebration.tsx# Confetti & celebration on profile completion
│       │   └── ApiConfigModal.tsx  # Express backend host switcher (LAN/Heroku/Railway)
│       ├── screens/                # Main feature screens
│       │   ├── HomeScreen.tsx      # Dashboard view: totals, recent parties, quick actions
│       │   ├── CustomersScreen.tsx # Directory with search and filter pills (All/Collect/Pay/Settled)
│       │   ├── CashbookScreen.tsx  # Daily shop cash sales & expense tracker (Rokar In/Out)
│       │   ├── ReportsScreen.tsx   # Business analytics & printable PDF statement preview
│       │   ├── SettingsScreen.tsx  # Store profile, language, currency, backup, and account signout
│       │   ├── AuthScreen.tsx      # Supabase email/password login & registration
│       │   ├── IntroScreen.tsx     # First-run onboarding carousel
│       │   ├── WelcomeScreen.tsx   # Welcome landing screen before auth
│       │   └── OnboardingWizardModal.tsx # Store setup wizard (store name, owner, phone)
│       ├── services/               # Frontend service layer
│       │   ├── api.ts              # Axios/Fetch HTTP service for Express backend & WhatsApp
│       │   ├── storage.ts          # Offline-first AsyncStorage + Supabase cloud sync
│       │   ├── supabase.ts         # Supabase client initialized with AsyncStorage token storage
│       │   ├── authErrors.ts       # Human-friendly auth error message formatter
│       │   └── reminderTemplates.ts# Default polite reminder templates (Urdu/English)
│       ├── hooks/                  # Custom React hooks
│       │   ├── useVoiceRecording.ts# Audio capture lifecycle, permissions, and backend dispatch
│       │   └── useReducedMotion.ts # Accessibility hook for motion preferences
│       ├── i18n/                   # Internationalization
│       │   ├── copy.ts             # Roman Urdu & English copy strings
│       │   └── translations.ts     # Multi-language string catalogs
│       ├── theme/                  # Design tokens & styling
│       │   ├── colors.ts           # Theme colors (Gave crimson, Got emerald, slate text)
│       │   ├── tokens.ts           # Spacing, radius, motion durations, typography scales
│       │   ├── typography.ts       # Plus Jakarta Sans + Inter web font loader
│       │   └── webStyles.ts        # Custom CSS overrides for web responsiveness
│       ├── types/                  # TypeScript interface definitions
│       │   └── index.ts            # Party, Transaction, CashbookEntry, StoreProfile, VoiceResult
│       └── ui/                     # Reusable design primitives (Button, Card, Money, Row, Sheet...)
├── backend/                        # Express 5 API server
│   ├── src/
│   │   ├── server.ts               # Express bootstrap, route mounts, CORS, graceful shutdown
│   │   ├── routes/                 # Express route handlers
│   │   │   ├── auth.routes.ts      # Auth endpoints
│   │   │   ├── customer.routes.ts  # Customer CRUD endpoints
│   │   │   ├── transaction.routes.ts # Transaction CRUD endpoints
│   │   │   ├── voice.routes.ts     # Voice processing & TTS endpoints
│   │   │   ├── dashboard.routes.ts # Dashboard analytics endpoints
│   │   │   └── whatsapp.routes.ts  # WhatsApp Web QR linking, status, sending, scheduling
│   │   ├── controllers/            # Controller business logic
│   │   │   ├── auth.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── voice.controller.ts # STT, multi-LLM parsing, Levenshtein fuzzy matching
│   │   │   ├── dashboard.controller.ts
│   │   │   └── whatsapp.controller.ts # SSE QR emitter, send reminder, schedules
│   │   ├── middleware/             # Express middlewares
│   │   │   ├── auth.middleware.ts  # Supabase Bearer token verification
│   │   │   ├── voiceLimit.middleware.ts # Daily voice processing quota + dev bypass
│   │   │   └── errorHandler.ts     # Standardized JSON error response handler
│   │   ├── services/               # Backend external services
│   │   │   ├── supabase.service.ts # Supabase Admin client (PostgreSQL & Auth)
│   │   │   └── whatsapp.service.ts # Baileys v7 socket, credentials, messaging, scheduler
│   │   ├── database/               # Database SQL migrations
│   │   │   ├── schema_v2.sql       # Production multi-tenant schema with RLS & indexes
│   │   │   └── schema.sql          # Legacy base schema
│   │   └── types/                  # Backend type definitions
│   ├── Dockerfile                  # Multi-stage production container build (node:22-alpine)
│   ├── Procfile                    # Process declaration for Heroku deployment
│   ├── railway.json                # Deployment configuration for Railway
│   └── package.json                # Backend dependencies (Express 5, Baileys v7, Supabase JS)
├── docs/                           # Architectural, product & security documentation
│   ├── 01-product-vision.md
│   ├── 02-technical-stack-and-data.md
│   ├── 03-voice-and-mobile-features.md
│   ├── 04-backend-api-testing-and-deployment.md
│   └── 05-execution-security-and-roadmap.md
├── .qoder/repowiki/                # Qoder-generated codebase wiki and knowledge articles
├── EAS_BUILD.md                    # BolKhata-specific EAS Android APK build guide
├── auth.md                         # Supabase Authentication architecture and flows
├── CONTEXT.md                      # AI Assistant context and developer reference
├── CONTRIBUTING.md                 # Contribution guidelines
└── CODE_OF_CONDUCT.md             # Contributor Covenant Code of Conduct
```

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Mobile Runtime** | React Native `0.81.5` on **Expo SDK 54** | Managed workflow with clean EAS prebuilds |
| **Web Runtime** | React `19.1.0`, React Native Web `0.21.0` | Metro runtime with static export support |
| **Language** | TypeScript (Strict) | Frontend `^5.3.3`, Backend `^7.0.2` |
| **Authentication** | **Supabase Auth** (`@supabase/supabase-js ^2.112.3`) | Email & password, PKCE deep links (`bolkhata://`), session cache via AsyncStorage |
| **Audio Capture** | `expo-av` | High-fidelity audio recording, mic permission handling, web & mobile compatibility |
| **Voice STT** | Groq `whisper-large-v3` / ElevenLabs Scribe | High-accuracy South Asian speech-to-text |
| **Intent Extraction** | Groq Llama 3 / Google Gemini / Alibaba Qwen | JSON schema extraction for 5 financial intents |
| **Voice TTS** | Alibaba DashScope `qwen3-tts-flash` / ElevenLabs | Spoken Roman Urdu / Urdu confirmation generation |
| **Fuzzy Matching** | Levenshtein Distance Algorithm | Tolerant name resolution against current party ledger |
| **WhatsApp Automation** | **Baileys v7** (`@whiskeysockets/baileys ^7.0.0-rc14`) | Multi-device WhatsApp Web engine, SSE QR stream, automated scheduling |
| **Backend API** | Express `5.2.1` on **Node 22** | Modular controllers, routes, and middlewares |
| **Database** | **Supabase PostgreSQL** | Multi-tenant schema (`schema_v2.sql`), RLS, optimized indexes |
| **Client Storage** | `@react-native-async-storage/async-storage` | User-scoped local cache with automatic cloud reconciliation |
| **Icons & UI** | `lucide-react-native` + custom SVG primitives | Optimized imports via Babel plugin |
| **Typography** | Plus Jakarta Sans (figures & headers) + Inter (body) | Crisp, modern typographic hierarchy |

---

## ⚙️ Environment Variables

### Frontend Configuration (`frontend/.env` / `frontend/.env.local`)

```env
# URL of the Express API Backend
EXPO_PUBLIC_API_URL=https://bolkhata-api-241d1d60fc07.herokuapp.com

# Supabase Project Credentials
EXPO_PUBLIC_SUPABASE_URL=https://fdociazyyufqdfraacjc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> **Note**: `EXPO_PUBLIC_*` variables are embedded into client JavaScript bundles at build time. Whenever these values are changed, restart the Metro bundler with cache cleared (`npx expo start -c`).

### Backend Configuration (`backend/.env`)

```env
PORT=3000
NODE_ENV=production

# Supabase Admin Connection
SUPABASE_URL=https://fdociazyyufqdfraacjc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...

# AI Provider Keys
GROQ_API_KEY=gsk_...
DASHSCOPE_API_KEY=sk-...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...

# Rate Limiting & Developer Access
DAILY_VOICE_LIMIT=50
DEVELOPER_EMAILS=talhairfan1947@gmail.com,admin@bolkhata.com,dev@bolkhata.com
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v22.x` or higher
- **npm**: `v10.x` or higher
- **EAS CLI**: `npm install -g eas-cli` (for mobile builds)

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

- The API starts on `http://localhost:3000`.
- Health check:
  ```bash
  curl http://localhost:3000/health
  # Response: {"status":"ok","app":"BolKhata API","uptime":...,"timestamp":"..."}
  ```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

From the interactive Expo terminal menu:
- Press `w` to run in a web browser.
- Press `a` to run on a connected Android device or emulator.
- Press `i` to run on iOS Simulator (macOS only).

---

## 🔌 API Reference

Base URL: `http://localhost:3000` (Local) or `https://bolkhata-api-241d1d60fc07.herokuapp.com` (Production)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Server uptime and health status |
| `GET` | `/` | Public | API root info or redirect to web frontend |
| `POST` | `/voice/process` | Bearer Token | Processes audio (`multipart/form-data`) or text (`JSON`) into structured transaction intent |
| `POST` | `/voice/tts` | Bearer Token | Generates TTS audio stream from text |
| `GET` | `/customers` | Public / Token | List customers scoped to the active store |
| `POST` | `/customers` | Public / Token | Create a new customer (`name`, `phone`) |
| `GET` | `/customers/:id` | Public / Token | Retrieve specific customer record |
| `PUT` | `/customers/:id` | Public / Token | Update customer details (`name`, `phone`) |
| `DELETE` | `/customers/:id` | Public / Token | Remove customer record |
| `POST` | `/transactions` | Public / Token | Create transaction and recompute running balance |
| `GET` | `/transactions/customer/:id` | Public / Token | Get transaction history for a customer |
| `GET` | `/dashboard` | Public / Token | Dashboard metrics (`totalUdhaar`, `dueToday`) |
| `GET` | `/wa/link/:userId` | Public / Token | **Server-Sent Events (SSE)** stream delivering WhatsApp QR code |
| `GET` | `/wa/status/:userId` | Public / Token | Check WhatsApp session connection status |
| `DELETE` | `/wa/link/:userId` | Public / Token | Disconnect and wipe WhatsApp session credentials |
| `POST` | `/wa/remind` | Public / Token | Dispatch instant WhatsApp payment reminder text |
| `POST` | `/wa/schedule` | Public / Token | Schedule future WhatsApp reminder |
| `GET` | `/wa/schedule/:userId` | Public / Token | List scheduled reminders for user |
| `DELETE` | `/wa/schedule/:userId/:scheduleId` | Public / Token | Cancel scheduled reminder |
| `GET` | `/wa/history/:userId/:jid` | Public / Token | Retrieve WhatsApp chat history for contact |

---

## 🗄️ Database Schema (`schema_v2.sql`)

The production database schema is deployed on Supabase PostgreSQL with multi-tenant isolation, Row Level Security (RLS), and indexing:

1. **`stores`**: Multi-store/user profile (`id`, `user_id`, `name`, `owner_name`, `phone`, `currency`, `language`, `created_at`).
2. **`customers`**: Store parties/customers (`id`, `store_id`, `user_id`, `name`, `phone`, `address`, `type`, `balance`, `created_at`, `updated_at`).
3. **`transactions`**: Ledger entries (`id`, `store_id`, `customer_id`, `type` [`gave` | `got`], `amount`, `note`, `payment_mode`, `date`, `created_at`).
4. **`cashbook`**: Daily shop cash flow (`id`, `store_id`, `user_id`, `type` [`in` | `out`], `amount`, `category`, `note`, `date`, `created_at`).

### Balance Convention
- **Gave (Udhaar / Red)**: You gave goods/money; customer owes you (+balance).
- **Got (Jama / Green)**: You received payment; debt decreases (-balance).

---

## 📱 Mobile App Features

1. **Dashboard (Home)**:
   - High-level financial overview: Net balance, total to collect (Gave), total to pay (Got).
   - Quick action bar: Instant Gave / Got entry composers.
   - Recent customer list with colored status indicators.
2. **Floating Action Bottom Dock**:
   - Custom floating bar (`TabBar.tsx`) with Home, Customers, Cashbook, and Reports tabs.
   - **Central Action Button**: Floating microphone with pulsing rings that supports both **tap-to-record** and **hold-and-release** workflows.
   - **VoiceRecordingHUD**: Elevated animated recording overlay displaying real-time recording timer, waveform indicator, Roman Urdu prompt suggestions, and cancel/stop controls.
3. **Voice Assistant Modal**:
   - Displays recognized speech text, classified intent, detected person, extracted amount, and purpose.
   - Automatically matches spoken customer names against local ledger using Levenshtein distance.
   - Automatically captures customer phone number when provided via speech.
   - Generates and plays back spoken voice confirmations.
4. **WhatsApp Automation**:
   - In-app QR code scanner via SSE connection to link shopkeeper's personal or business WhatsApp.
   - Ready-to-send polite reminder templates in Roman Urdu and English.
   - Markdown preview of WhatsApp messages with store name and balance placeholders.
   - Scheduled reminder delivery engine.
5. **Cashbook (Rokar)**:
   - Daily shop cash sales (Cash In) and business expenses (Cash Out).
   - Filter by date, cash balance calculations, and categorized entries.
6. **Reports & PDF Export**:
   - Analytics summary: Credit breakdown, collection efficiency, customer counts.
   - Visual statement generator with printable preview.
7. **Offline-First & Cloud Sync**:
   - Seamless offline operation via user-scoped `AsyncStorage`.
   - Automatic bi-directional synchronization with Supabase when online.

---

## 📦 Build & Deployment

### Android APK Build via EAS Cloud
BolKhata is pre-configured with EAS Build for creating standalone installable Android APKs:

```bash
cd frontend
npm run build:apk
# Or directly:
eas build -p android --profile preview
```

See [EAS_BUILD.md](file:///d:/My-Github-Projects/BolKhata/EAS_BUILD.md) for full details on EAS project linking, credentials, and build profiles.

### Static Web Bundle
```bash
cd frontend
npm run build
```

### Backend Production Deployments
- **Heroku**: Configured with `Procfile` (`web: npm start`) and `heroku-postbuild`. Deployed at `https://bolkhata-api-241d1d60fc07.herokuapp.com`.
- **Railway**: Configured with `railway.json` and multi-stage `Dockerfile`. Deployed at `https://bolkhata-production-6447.up.railway.app`.

---

## 📄 License & Community

BolKhata is open-source software licensed under the [ISC License](file:///d:/My-Github-Projects/BolKhata/LICENSE).

- [Code of Conduct](file:///d:/My-Github-Projects/BolKhata/CODE_OF_CONDUCT.md)
- [Contributing Guide](file:///d:/My-Github-Projects/BolKhata/CONTRIBUTING.md)
- [EAS Build Guide](file:///d:/My-Github-Projects/BolKhata/EAS_BUILD.md)
- [Supabase Auth Documentation](file:///d:/My-Github-Projects/BolKhata/auth.md)
- [Architecture & AI Context](file:///d:/My-Github-Projects/BolKhata/CONTEXT.md)
- [Documentation Index](file:///d:/My-Github-Projects/BolKhata/docs)
