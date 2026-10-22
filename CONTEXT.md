# BolKhata (بول کھاتا / बोल खाता) — AI Assistant & Architectural Context Guide

Welcome! This document provides architectural, functional, and technical context for developers and AI coding assistants working in the **BolKhata** repository.

---

## 📌 Project Overview

**BolKhata** is an AI-powered **Voice-First Digital Ledger & Shop Management App** tailored for retail store owners and small shopkeepers in South Asia. It simplifies bookkeeping for credit (*Udhaar / Gave*) and debit (*Jama / Got*) transactions, daily cashbook sales, business reporting, and automated WhatsApp payment reminders.

- **Primary Persona**: Retail shopkeepers (Kirana stores, general merchants, hardware, clothing, and repair shops).
- **Core Value Proposition**: 
  - 1-tap/hold voice entry from the floating bottom navigation dock.
  - Spoken confirmation in the shopkeeper's language before ledger commitment.
  - Native WhatsApp payment reminders (instant sending and future scheduling via Baileys v7).
  - Offline-first reliability via user-scoped `AsyncStorage` paired with seamless Supabase cloud sync.
  - Multi-tenant architecture running on Express 5 and Supabase PostgreSQL.

---

## 🛠️ Technology Stack & Versions

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Monorepo** | Flat Package Structure | `frontend/` (Expo client), `backend/` (Express API) |
| **Mobile Runtime** | **Expo SDK ~54.0.0** (React Native `0.81.5`) | Managed workflow with clean EAS prebuilds |
| **Web Runtime** | React `19.1.0`, React Native Web `^0.21.0` | Metro runtime with static export support |
| **Backend Runtime** | **Node.js 22** + Express `5.2.1` | Native ESM loader for Baileys, TypeScript `^7.0.2` |
| **Language** | **TypeScript Strict** | Frontend `^5.3.3`, Backend `^7.0.2` |
| **Authentication** | **Supabase Auth** (`@supabase/supabase-js ^2.112.3`) | Email & password, PKCE deep links (`bolkhata://`, `veldger://`), session cache via AsyncStorage |
| **Persistence** | `@react-native-async-storage/async-storage` + Supabase PostgreSQL | User-scoped local storage (`userKey(key, userId)`) + cloud sync (`schema_v2.sql`) |
| **Audio Capture** | `expo-av` (`useVoiceRecording` hook) | Cross-platform recording, mic permission handling |
| **STT Pipeline** | Groq `whisper-large-v3` + ElevenLabs Scribe | Fast, accurate South Asian speech recognition |
| **Intent Parser** | Groq Llama 3 / Google Gemini / Alibaba Qwen | 5 ledger intents (`create_transaction`, `update_transaction`, `delete_transaction`, `delete_customer`, `get_balance`) |
| **TTS Generation** | Alibaba DashScope `qwen3-tts-flash` + ElevenLabs | Spoken confirmation wav audio generation |
| **WhatsApp Engine** | **Baileys v7** (`@whiskeysockets/baileys ^7.0.0-rc14`) | Multi-device WhatsApp Web engine, SSE QR stream, automated scheduler |
| **Typography** | **Plus Jakarta Sans** (Headings & Figures) + **Inter** (Body) | Web Google Fonts injection + native font fallbacks |
| **Icons** | `lucide-react-native` + Custom SVG primitives | Babel transform import plugin for barrel optimization |

---

## 📂 Repository Layout

```
BolKhata/
├── frontend/                       # Mobile & Web Frontend
│   ├── App.tsx                     # Root orchestrator: Auth gates, data sync, routing, modals, ledger math
│   ├── app.json                    # Expo configuration (version 1.1.0, versionCode 2, package com.bolkhata.app)
│   ├── eas.json                    # EAS Build profiles (Node 22, Android latest image, APK preview profile)
│   ├── package.json                # Dependencies and scripts (build:apk, type-check, web)
│   ├── tsconfig.json               # Extends expo/tsconfig.base
│   ├── .easignore                  # Excludes native android/ios folders and locks for clean managed prebuild
│   └── src/
│       ├── components/             # Reusable UI components & modals
│       │   ├── AppBar.tsx          # Top navigation bar with store avatar and settings trigger
│       │   ├── TabBar.tsx          # Floating bottom dock with center pulsing voice action button
│       │   ├── VoiceRecordingHUD.tsx # Elevated recording overlay with timer, pulse waveform, cancel/stop
│       │   ├── VoiceAssistantModal.tsx # Spoken confirmation review modal with intent execution
│       │   ├── VoiceLogo.tsx       # 5-bar animated voice equalizer icon
│       │   ├── BalanceCard.tsx     # Net Khata balance, total receivable (Gave) & payable (Got)
│       │   ├── CustomerCard.tsx    # Customer list card with colored balance badges
│       │   ├── CustomerLedgerPanel.tsx # Customer transaction timeline & WhatsApp CTAs
│       │   ├── TransactionModal.tsx # Manual transaction entry modal (Gave / Got)
│       │   ├── EditTransactionModal.tsx # Transaction update modal
│       │   ├── AddCustomerModal.tsx # New party registration modal (Customer / Supplier)
│       │   ├── EditCustomerModal.tsx # Customer details edit modal
│       │   ├── WhatsAppLinkModal.tsx # QR code scanner modal for linking WhatsApp via SSE
│       │   ├── WaTemplateModal.tsx # Pre-built polite WhatsApp reminder templates
│       │   ├── WaScheduleModal.tsx # Schedule future WhatsApp reminder modal
│       │   ├── WaMarkdownPreview.tsx # Live preview of WhatsApp formatting (*bold*, _italic_)
│       │   ├── SplashScreen.tsx    # Branded splash screen with animated letter reveal
│       │   ├── SetupCelebration.tsx# Celebration animation on store setup completion
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
│       ├── i18n/                   # Copy & localization
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
├── backend/                        # Express 5 API Server
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
└── docs/                           # Architectural, product & security documentation
```

---

## 🎨 Design System & UI Architecture

1. **Light & Tactile Aesthetic**:
   - Clean canvas (`#ffffff`), hairline borders (`#e2e8f0` / `rgba(15, 23, 42, 0.08)`), subtle elevations, and rounded cards (`RADIUS.lg = 16`, `RADIUS.md = 12`).
2. **Color Palette**:
   - **Gave (Udhaar / Debit)**: Crimson Red (`#E11D48` / `#BE123C`). Represents money or goods given out; the customer owes the store (+ balance).
   - **Got (Jama / Credit)**: Emerald Green (`#16A34A` / `#15803D`). Represents money received into the store (- balance).
   - **Primary Brand / Dark Accents**: Rich Slate & Black (`#0f172a` / `#020617`).
3. **Typography**:
   - **Headings & Figures**: Plus Jakarta Sans (`FONTS.headingBold`, `FONTS.headingExtraBold`) for numerical amounts, headers, and store titles.
   - **Body & Subtitles**: Inter (`FONTS.bodyRegular`, `FONTS.bodyMedium`, `FONTS.bodySemiBold`) for dates, phone numbers, transaction notes, and metadata.
4. **Floating Action Bottom Dock**:
   - `TabBar.tsx` floats above screen content with backdrop blur and shadow.
   - 4 content tabs (Home, Customers, Cashbook, Reports).
   - Central **Action Button** (floating microphone) supports **tap** or **press-and-hold** interactions, driving `VoiceRecordingHUD.tsx` and the `useVoiceRecording` hook.

---

## ⚡ Key Workflows & Engineering Patterns

### 1. Ledger Balance Reconciliation
- A customer's balance is **never** a loose editable number; it is immutably computed as the sum of all their transactions:
  $$\text{balance} = \sum (\text{Gave entries}) - \sum (\text{Got entries})$$
- Opening balances are saved as real transactions (`type: 'gave' | 'got'`, `note: 'Opening balance'`) so that future audits, edits, or deletes recalculate cleanly.

### 2. User-Scoped Local Storage
- To prevent cross-account data leakage on shared devices, `StorageService` scopes local `AsyncStorage` keys using `userKey(baseKey, userId)`:
  ```ts
  const userKey = (baseKey: string, userId?: string) =>
    userId ? `${baseKey}_${userId}` : baseKey;
  ```
- When a user signs in, their user-scoped local cache is loaded and merged with their Supabase cloud data. When signed out, state is cleared.

### 3. Voice Processing Pipeline
1. `useVoiceRecording` hook records audio via `expo-av`.
2. Audio is uploaded to `POST /voice/process` with `Authorization: Bearer <token>`.
3. `voiceLimitMiddleware` enforces a daily limit (default 50) with developer bypass (`DEVELOPER_EMAILS` or `is_developer` metadata).
4. `voice.controller.ts` transcribes via Groq Whisper / ElevenLabs, parses financial intent via Groq Llama / Gemini / Qwen, and runs a Levenshtein fuzzy match on existing customer names.
5. `VoiceAssistantModal.tsx` opens with the parsed preview and plays spoken TTS confirmation.
6. On user confirmation, the transaction is committed immutably and synced to Supabase.

### 4. WhatsApp Automation
- `backend/src/services/whatsapp.service.ts` uses Baileys v7 with custom ESM loader and per-user session storage under `wa/<userId>/`.
- `GET /wa/link/:userId` streams a QR code via Server-Sent Events (SSE).
- Shopkeepers scan the QR code using their WhatsApp app. Once connected, reminders can be sent directly via `POST /wa/remind` or scheduled via `POST /wa/schedule`.

---

## 🚀 Key Commands

### Development
```bash
# Start Backend API (Port 3000)
cd backend && npm run dev

# Start Frontend (Web / Metro Dev Server on Port 8081)
cd frontend && npm start
# or explicitly for web:
cd frontend && npm run web
```

### Type Checking & Validation
```bash
cd frontend && npm run type-check
cd backend  && npx tsc --noEmit
```

### Production Build & Export
```bash
# Build Android APK via EAS Cloud
cd frontend && npm run build:apk

# Export static web bundle
cd frontend && npm run build

# Build backend for production
cd backend && npm run build && npm start
```
