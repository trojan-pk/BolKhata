# BolKhata (बोल खाता / بول کھاتہ) — Voice-First AI Digital Ledger

**BolKhata** is an AI-powered, voice-first digital ledger and shop management app built for retail store owners, Kirana shops, and merchants across South Asia. The shopkeeper simply **speaks** a credit (*Udhaar / Gave*) or debit (*Jama / Got*) transaction in Urdu, Roman Urdu, Hindi, or English, and the app transcribes it, extracts structured intent with an LLM, verifies the party, and updates the digital *khata* with running balances. It also features daily cashbook management, financial reports, and automated polite WhatsApp payment reminders via Baileys.

Built for the **Alibaba Cloud AI Hackathon Pakistan 2026** (Alkhidmat Foundation Pakistan / Bano Qabil ecosystem). Team: **Trojan**.

> **Core Value Proposition**: 1-tap voice entry, multi-tier STT/LLM failover, Supabase Auth & Multi-Tenant PostgreSQL sync, native Baileys WhatsApp Web reminder automation, and a custom atomic UI design system.

---

## 🎯 Core Flow

```text
🎙️  "Ahmed ne 500 ka saman udhaar liya"
         │
         ├─ expo-av records microphone → audio m4a/wav
         ▼
   POST /voice/process (multipart audio OR JSON text)
         │
         ├─ STT Cascade: ElevenLabs Scribe → Groq Whisper Large v3 Turbo
         ├─ LLM Brain: Google Gemini Flash Lite → DashScope Qwen Turbo → Groq Llama 3.3 70B
         ├─ Intent Schema: { intent, person: "Ahmed", transaction: { direction: "gave", amount: 500 } }
         ├─ Fuzzy Contact Matching: Levenshtein distance against existing customers
         ▼
   Interactive Confirmation Sheet in App
         │
   Shopkeeper reviews & taps Confirm
         ▼
   Authoritative Ledger Update → Supabase Multi-Tenant PostgreSQL & Local Storage
         ▼
   WhatsApp Payment Reminder Dispatch (Instant 1-tap or Scheduled via Baileys)
```

---

## 📂 Repository Structure (Monorepo)

```
BolKhata/
├── frontend/                       # React Native application — Expo SDK 54
│   ├── App.tsx                     # Main app root: Splash, Supabase Auth, Onboarding, Modals, Tab navigation
│   ├── index.ts                    # registerRootComponent entry
│   ├── app.json                    # Expo config: scheme `bolkhata`, audio permissions
│   ├── babel.config.js             # lucide barrel-import rewrite
│   ├── eas.json                    # EAS Cloud build config for Android/iOS
│   └── src/
│       ├── components/             # Reusable modals & complex UI (AppBar, TabBar, CustomerLedgerPanel,
│       │                           # VoiceAssistantModal, VoiceOrb, WhatsAppLinkModal, WaScheduleModal, etc.)
│       ├── i18n/                   # Localized strings: Roman Urdu, Urdu script, English (copy.ts, translations.ts)
│       ├── screens/                # AuthScreen, IntroScreen, WelcomeScreen, OnboardingWizardModal,
│       │                           # HomeScreen, CustomersScreen, CashbookScreen, ReportsScreen, SettingsScreen
│       ├── services/               # api.ts (Express connector), storage.ts (AsyncStorage + Supabase sync),
│       │                           # supabase.ts (Supabase JS Client instance)
│       ├── theme/                  # colors.ts, tokens.ts, typography.ts (Plus Jakarta Sans & Inter)
│       ├── types/                  # Party, Transaction, CashbookEntry, StoreProfile, VoiceResult
│       ├── ui/                     # Production-grade atomic UI system (Button, Card, Sheet, Money, etc.)
│       └── utils/                  # Formatting helpers (currency, dates, phone numbers)
│
├── backend/                        # Express 5 Node.js & TypeScript API server
│   ├── Dockerfile                  # Production container definition
│   ├── Procfile                    # Railway / Heroku process declaration
│   ├── railway.json                # Railway deployment config
│   ├── database/
│   │   └── schema_v2.sql           # Clean Supabase PostgreSQL Multi-Tenant schema with RLS & indexes
│   └── src/
│       ├── server.ts               # Express bootstrap, CORS, route mounting, graceful shutdown
│       ├── routes/                 # /auth, /customers, /transactions, /voice, /dashboard, /wa
│       ├── controllers/            # Controller business logic
│       ├── middleware/             # auth.middleware.ts, errorHandler.ts, voiceLimit.middleware.ts
│       └── services/               # supabase.service.ts, whatsapp.service.ts (Baileys socket & SSE QR)
│
├── docs/                           # Architectural, product & deployment documentation
├── .agents/skills/                 # Agent skills (Supabase & Postgres best practices)
└── CONTEXT.md                      # AI coding assistant context guide
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Mobile / Web** | React Native `0.81.5` on **Expo SDK 54** |
| **UI Runtime** | React `19.1.0`, React Native Web `0.21.0`, `@expo/metro-runtime` |
| **Language** | TypeScript strict — frontend `^5.3.3`, backend `^7.0.2` |
| **Authentication** | **Supabase Auth** (`@supabase/supabase-js: ^2.112.3`) — Email/Password, Google OAuth (PKCE & Hash token flow) |
| **Persistence** | `@react-native-async-storage/async-storage` (per-user scoped) + Supabase PostgreSQL |
| **WhatsApp Engine** | **Baileys v7** (`@whiskeysockets/baileys: ^7.0.0-rc14`) — Direct WhatsApp Web socket connection & SSE QR streaming |
| **Speech-to-Text** | Multi-tier failover: **ElevenLabs Scribe STT** (`scribe_v1`) $\rightarrow$ **Groq Whisper Large v3 Turbo** |
| **LLM Brain Engine** | Multi-tier failover: **Google Gemini Flash Lite** $\rightarrow$ **Alibaba Cloud DashScope Qwen Turbo** $\rightarrow$ **Groq Llama 3.3 70B** |
| **Text-to-Speech** | `expo-speech` (native) & ElevenLabs TTS |
| **Typography** | **Plus Jakarta Sans** (headings, amounts & figures) + **Inter** (body & controls) |

---

## ⚙️ Environment Variables

### `frontend/.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### `backend/.env`
```env
PORT=3000
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
DASHSCOPE_API_KEY=sk-...
GROQ_API_KEY=gsk_...
ELEVENLABS_API_KEY=sk_...
FRONTEND_URL=http://localhost:8081
```

---

## 🚀 Getting Started

### 1. Backend
```bash
cd backend
npm install
npm run dev                   # nodemon + tsx on http://localhost:3000
```

Health check:
```bash
curl http://localhost:3000/health
```

### 2. Frontend (Separate Terminal)
```bash
cd frontend
npm install
npm run web                   # Start web development server (Port 8081)
# OR
npm run start                 # Start Expo Metro bundler for iOS/Android Expo Go
```

---

## 🔌 API Reference

Base URL: `http://localhost:3000`

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and uptime status |
| `POST` | `/voice/process` | Audio upload (`multipart/form-data`) or JSON text parsing |
| `POST` | `/voice/tts` | Multilingual TTS speech generation |
| `GET` | `/wa/link/:userId` | Server-Sent Events (SSE) stream for live QR code pairing |
| `GET` | `/wa/status/:userId` | Get WhatsApp connection status |
| `DELETE` | `/wa/link/:userId` | Unlink WhatsApp account and clear session |
| `POST` | `/wa/remind` | Send instantaneous payment reminder text |
| `POST` | `/wa/schedule` | Schedule a future reminder delivery |
| `GET` | `/wa/schedule/:userId` | List pending scheduled reminders |
| `DELETE` | `/wa/schedule/:userId/:scheduleId` | Cancel a scheduled reminder |
| `GET` | `/customers` | List store customers & suppliers |
| `POST` | `/customers` | Register customer/supplier with opening balance |
| `GET` | `/transactions` | List transaction entries |
| `POST` | `/transactions` | Create Gave / Got ledger entry |
| `GET` | `/dashboard/summary` | Authoritative aggregated store totals |

---

## 🗄️ Database Model (Schema v2)

Run `backend/src/database/schema_v2.sql` in the Supabase SQL editor:
- **`stores`**: Multi-tenant merchant profile, business category, account type.
- **`customers`**: Store contacts with balance and type (`customer` / `supplier`).
- **`transactions`**: Credit (`gave`) and debit (`got`) ledger entries with timestamps and notes.
- **`cashbook`**: Daily cash in (`in`) and cash out (`out`) rokar entries.
- **Row Level Security (RLS)** enabled across all tables.

---

## 🧪 Typecheck & Build

```bash
# Typecheck frontend and backend
cd frontend && npm run type-check
cd backend  && npm run build

# Build Android APK via EAS Cloud
cd frontend && npm run build:apk
```

---

## 📄 License

See [LICENSE](LICENSE).
