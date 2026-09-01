# BolKhata (बोल खाता / بول کھاتہ) — AI Assistant Context Guide

Welcome! This document provides complete architectural, functional, and technical context for AI coding assistants working on the **BolKhata** repository.

---

## 📌 Project Overview

**BolKhata** is a **Voice-First AI Digital Ledger & Shop Management Platform** tailored for retail store owners, Kirana shops, wholesale traders, and small businesses in South Asia. It empowers merchants to record credit (*Udhaar / Gave*) and debit (*Jama / Got*) transactions in Roman Urdu, Urdu, Hindi, or English using natural spoken voice, manages daily cashbook rokar, generates instant business reports, and delivers polite automated WhatsApp payment reminders.

- **Primary Persona**: Retail merchants, shopkeepers, and local suppliers.
- **Core Value Proposition**: 1-tap voice entry with real-time multi-provider AI failover, offline-first local cache with Supabase Cloud multi-tenant sync, native Baileys WhatsApp Web integration for reminder delivery, and a polished design system with modern typography and animations.

---

## 🛠️ Technology Stack

### 📱 Frontend Layer (`/frontend`)
| Technology | Specification | Details |
| :--- | :--- | :--- |
| **Framework** | **React Native** with **Expo SDK 54** | Managed Workflow (`react-native: 0.81.5`, `react: 19.1.0`) |
| **Web Engine** | **React Native Web** | Web support via `react-dom: 19.1.0`, `@expo/metro-runtime: ~6.1.2`, `react-native-web: ^0.21.0` |
| **Authentication** | **Supabase Auth** | `@supabase/supabase-js: ^2.112.3`, Email/Password & Google OAuth, PKCE & hash token exchanges |
| **Persistence** | **AsyncStorage + Cloud** | `@react-native-async-storage/async-storage: 2.2.0` with per-user scoping & Supabase PostgreSQL cloud sync |
| **Audio & Media** | `expo-audio`, `expo-speech` | High-fidelity voice recording, waveform visualization, and native speech synthesis |
| **PDF & Sharing** | `expo-print`, `expo-sharing` | Ledger statement PDF export via HTML render + native share sheet |
| **Icons** | `lucide-react-native` | Consistent vector iconography |
| **Typography** | **Google Fonts** | **Plus Jakarta Sans** (Headings, Numerics & Amounts) + **Inter** (Body, Subtitles & Controls) |
| **Design System** | Custom Atomic UI Library (`src/ui`) | `Avatar`, `Button`, `Card`, `Chip`, `CrossFade`, `DrawnCheck`, `EmptyState`, `Feedback`, `Field`, `Headers`, `Money`, `Press`, `Row`, `Segmented`, `Sheet`, `Skeleton` |
| **Internationalization** | Multi-lingual (`src/i18n`) | Roman Urdu (`roman_ur`), Urdu Script (`ur`), English (`en`) |

### 🔙 Backend Layer (`/backend`)
| Technology | Specification | Details |
| :--- | :--- | :--- |
| **Runtime & Server** | **Node.js** + **Express 5.2.1** | TypeScript (`tsx`, `typescript: ^7.0.2`), CORS, JSON parser |
| **Database** | **Supabase PostgreSQL** | Schema v3 (single source of truth: `backend/supabase/migrations/`): per-user tenancy with enforced RLS (`auth.uid() = user_id`), trigger-derived `transactions.user_id`, trigger-recomputed `customers.balance`, and the `increment_voice_usage` RPC |
| **WhatsApp Engine** | **Baileys v7** (`@hapi/boom`, `qr-image`) | Direct WhatsApp Web socket connection, single-use SSE pairing tickets (60s TTL) with 15s heartbeats, duplicate-socket guard, scheduler with retry/backoff, and chat history |
| **Speech-to-Text (STT)** | 3-Tier Multi-Provider Failover | **Tier 1**: ElevenLabs Scribe STT (`scribe_v1`)<br>**Tier 2**: Groq Whisper Large v3 Turbo (`whisper-large-v3-turbo`, language auto-detect)<br>**Tier 3**: Local / direct text payload — every tier wrapped in `AbortSignal` timeouts |
| **LLM Brain Engine** | 3-Tier Multi-Model Failover | **Tier 1**: Google Gemini Flash Lite (`gemini-flash-lite-latest`)<br>**Tier 2**: Alibaba Cloud DashScope Qwen Turbo (`qwen-turbo`)<br>**Tier 3**: Groq Llama 3.3 70B (`llama-3.3-70b-versatile`) — every tier wrapped in `AbortSignal` timeouts |
| **Validation & Safety** | `zod`, `multer`, Rate Limiting | Zod request validation on every mutating route, PII-safe logging (VOICE_DEBUG gated), DB-backed daily voice quota via `increment_voice_usage` RPC with in-memory fallback, and phonetic + Levenshtein fuzzy party name matching (`src/utils/matching.ts`) |
| **Testing** | **Vitest** | Unit tests for backend matching utils and frontend ledger/uuid utils (`npm test` in both workspaces) |

---

## 📂 Codebase Structure

```
BolKhata/
├── CONTEXT.md                  # Main AI context guide (this file)
├── README.md                   # Project overview and hackathon documentation
├── docs/                       # Detailed architectural and domain documentation
│   ├── 01-product-vision.md
│   ├── 02-technical-stack-and-data.md
│   ├── 03-voice-and-mobile-features.md
│   ├── 04-backend-api-testing-and-deployment.md
│   └── 05-execution-security-and-roadmap.md
│
├── frontend/                   # Expo React Native client application
│   ├── App.tsx                 # Root application coordinator: Splash, Auth, Onboarding, Modals, Tabs
│   ├── index.ts                # Application entry point (`registerRootComponent`)
│   ├── app.json                # Expo project configuration
│   ├── package.json            # Frontend dependencies & npm scripts
│   ├── tsconfig.json           # TypeScript configuration
│   ├── eslint.config.js        # ESLint flat config (eslint-config-expo)
│   ├── eas.json                # EAS Build configuration for Android/iOS
│   └── src/
│       ├── components/     # Reusable feature modals & complex components
│       │   ├── AddCustomerModal.tsx     # Register customer or supplier with opening balance
│       │   ├── ApiConfigModal.tsx       # Express API connector configuration modal
│       │   ├── AppBar.tsx               # Store header with active profile and settings trigger
│       │   ├── BalanceCard.tsx          # Net balance, gave/got summary cards
│       │   ├── CustomerCard.tsx         # Customer list item with status badge
│       │   ├── CustomerLedgerPanel.tsx  # Detailed ledger statement, settlement, and reminder action
│       │   ├── EditTransactionModal.tsx # Edit or delete existing transactions
│       │   ├── EntryRow.tsx             # Single ledger entry row item
│       │   ├── GoogleIcon.tsx           # Google OAuth brand icon SVG
│       │   ├── SetupCelebration.tsx     # Post-onboarding celebration animation
│       │   ├── SplashScreen.tsx         # Initial brand logo reveal animation
│       │   ├── TabBar.tsx               # Floating animated pill dock navigation
│       │   ├── TransactionModal.tsx     # Manual Gave/Got transaction composer
│       │   ├── VoiceAssistantModal.tsx  # Voice recording, audio visualizer, AI parser, confirmation
│       │   ├── VoiceLogo.tsx            # Animated 5-bar voice equalizer logo
│       │   ├── VoiceOrb.tsx             # Pulsing voice recording state orb
│       │   ├── WaMarkdownPreview.tsx    # Live WhatsApp message formatting preview
│       │   ├── WaScheduleModal.tsx      # Schedule future reminder delivery
│       │   ├── WaTemplateModal.tsx      # Customizable WhatsApp reminder templates
│       │   ├── WhatsAppIcon.tsx         # WhatsApp brand icon SVG
│       │   └── WhatsAppLinkModal.tsx    # SSE QR Code pairing dialog for WhatsApp Web
│       ├── i18n/               # Internationalization & localized strings
│       │   ├── copy.ts                  # Structured UI copy tokens
│       │   └── translations.ts          # Comprehensive Urdu, Roman Urdu & English dictionaries
│       ├── screens/            # Primary application screens
│       │   ├── AuthScreen.tsx           # Email/Password + Google OAuth authentication
│       │   ├── CashbookScreen.tsx       # Daily cash in/out rokar management
│       │   ├── CustomersScreen.tsx      # Directory with Search & Filter tabs (All/Collect/Pay/Settled)
│       │   ├── HomeScreen.tsx           # Main dashboard: balance cards, quick actions, recent feed
│       │   ├── IntroScreen.tsx          # 3-slide introductory pitch deck
│       │   ├── OnboardingWizardModal.tsx# Shopkeeper profile setup wizard
│       │   ├── ReportsScreen.tsx        # Financial analytics, date filtering & PDF export preview
│       │   ├── SettingsScreen.tsx       # Store profile, language, currency, WhatsApp linking & API config
│       │   └── WelcomeScreen.tsx        # Get Started / Sign In landing view
│       ├── services/           # Data & API abstraction layer
│       │   ├── api.ts                   # Express Backend REST & Voice API client
│       │   ├── reminderTemplates.ts     # Pre-built WhatsApp reminder copy templates
│       │   ├── storage.ts               # AsyncStorage local persistence + Supabase cloud fallback
│       │   └── supabase.ts              # Supabase JS client instance with AsyncStorage auth adapter
│       ├── theme/              # Design tokens and styling
│       │   ├── colors.ts                # Brand palette: Gave Red (#E11D48), Got Green (#16A34A), Ink
│       │   ├── tokens.ts                # Spacing, radius, elevation, motion duration constants
│       │   └── typography.ts            # Plus Jakarta Sans & Inter typography definitions
│       ├── types/              # Global TypeScript interfaces & domain models
│       │   └── index.ts                 # Party, Transaction, Cashbook, StoreProfile, VoiceResult types
│       ├── ui/                 # Production-grade atomic UI component system
│       │   └── [Avatar, Button, Card, Chip, CrossFade, DrawnCheck, EmptyState, Feedback, Field, Headers, Money, Press, Row, Segmented, Sheet, Skeleton, icon, index].tsx
│       └── utils/              # Utility helpers
│           ├── format.ts               # Currency, phone, and date formatters
│           ├── ledger.ts               # Ledger math (balanceFor, withRecalculatedBalance) + legacy-id repair
│           ├── ledger.test.ts          # Vitest unit tests
│           ├── uuid.ts                 # Dependency-free UUID v4 generator + isUuid check
│           └── uuid.test.ts            # Vitest unit tests
│
└── backend/                    # Express Node.js & TypeScript API server
    ├── Dockerfile              # Production container build definition
    ├── Procfile                # Heroku / Railway deployment process
    ├── railway.json            # Railway deployment configuration
    ├── package.json            # Backend dependencies & npm scripts
    ├── tsconfig.json           # TypeScript configuration
    ├── supabase/
    │   └── migrations/
    │       └── 20260901000000_unified_schema_v3.sql  # Single source of truth: tables, RLS, triggers, RPCs
    └── src/
        ├── server.ts           # Express application setup, CORS, routes & graceful shutdown
        ├── controllers/        # Business logic controllers
        │   ├── customer.controller.ts   # Customer CRUD & balance recalculation
        │   ├── dashboard.controller.ts  # Authoritative dashboard totals aggregation
        │   ├── transaction.controller.ts# Transaction creation & ledger integrity
        │   ├── voice.controller.ts      # Multi-provider STT & LLM intent parsing
        │   └── whatsapp.controller.ts   # Baileys WhatsApp linking, reminders & scheduling
        ├── middleware/         # Express middleware
        │   ├── auth.middleware.ts       # Supabase JWT token verification
        │   ├── errorHandler.ts          # Centralized error handler
        │   ├── validate.middleware.ts   # Zod request body validation
        │   └── voiceLimit.middleware.ts # DB-backed daily voice quota rate limiting
        ├── routes/             # Express route declarations
        │   ├── customer.routes.ts       # `/customers/*`
        │   ├── dashboard.routes.ts      # `/dashboard/*`
        │   ├── transaction.routes.ts    # `/transactions/*`
        │   ├── voice.routes.ts          # `/voice/*`
        │   └── whatsapp.routes.ts       # `/wa/*`
        ├── services/           # External service connectors
        │   ├── supabase.service.ts      # Supabase client connector
        │   └── whatsapp.service.ts      # Baileys WhatsApp connection, SSE QR streamer, and scheduler
        ├── types/              # Backend TypeScript types
        │   └── qr-image.d.ts            # Type declaration for the qr-image module
        ├── utils/              # Shared helpers
        │   ├── matching.ts             # Phonetic alias + Levenshtein fuzzy party matching
        │   └── matching.test.ts        # Vitest unit tests
        └── validators/          # Request validation schemas
            └── index.ts                # Zod schemas for all mutating endpoints
```

---

## 🎨 Design System & UI Principles

1. **Clean Canvas**: Light mode default with crisp `#ffffff` cards, soft background `#F8FAFC`, slate ink `#0F172A`, and hairline dividers `#E2E8F0`.
2. **Distinct Semantic Colors**:
   - **Gave (Udhaar / You'll Collect)**: Crimson Red (`#E11D48`)
   - **Got (Jama / You'll Pay)**: Emerald Green (`#16A34A`)
   - **Brand Primary**: Rich Slate Ink (`#0F172A` / `#000000`)
   - **Accent / Info**: Sky Blue (`#0284C7`)
3. **Typography**:
   - `FONTS.headingBold` / `FONTS.headingExtraBold`: **Plus Jakarta Sans** for headers, metrics, and rupee amounts.
   - `FONTS.bodyRegular` / `FONTS.bodyMedium` / `FONTS.bodySemiBold`: **Inter** for form labels, notes, transactions, and buttons.
4. **Navigation**:
   - Floating Dark Pill Dock (`#0F172A`) with spring-animated active pill indicator and dedicated Voice Mic center button.

---

## 🚀 Key Commands

### Frontend Development (`/frontend`)
```bash
# Start Web Development Server (Port 8081)
cd frontend
npm run web

# Start Mobile Expo Go (Android / iOS)
npm run start

# Run TypeScript Validation
npm run type-check

# Run ESLint (flat config, eslint-config-expo)
npm run lint

# Run Vitest Unit Tests
npm test

# Build Static Web Bundle
npm run build

# Build Android APK via EAS Cloud
npm run build:apk
```

### Backend Development (`/backend`)
```bash
# Start Backend Development Server with hot-reload (Port 3000)
cd backend
npm run dev

# Build Backend TypeScript to dist/
npm run build

# Run Vitest Unit Tests
npm test

# Start Production Server
npm run start
```

---

## ⚠️ Gotchas & Execution Rules

1. **Monorepo Commands**: Always ensure you are inside either `frontend/` or `backend/` before running npm commands.
2. **Deterministic Ledger Math**: Never allow the LLM to directly calculate account balances or mutate the database. The LLM extracts intent and parameters; backend / local ledger services calculate balances authoritatively.
3. **Fuzzy Customer Matching**: Voice statements like *"Ali ko 500 diye"* are matched against existing customers using phonetic aliases (osama→usama, ahmad→ahmed), honorific stripping ("Usama Bhai" → "usama"), and Levenshtein distance before prompting to create a new customer.
4. **WhatsApp Session Storage**: WhatsApp Web sessions are managed on the backend inside `backend/wa/<userId>/` directories (git-ignored) and must never be exposed to the client.
5. **Multi-Tenant Scoping**: All Supabase tables (`stores`, `customers`, `transactions`, `cashbook`, `voice_usage`) carry `user_id` with RLS enforced per operation. `transactions.user_id` is derived from the owning customer by trigger, and `customers.balance` is recomputed by trigger — never write these directly.
6. **Every Backend Route Requires a Supabase JWT**: identity always comes from the verified token (`req.user.id`), never from URL params or request bodies. The one exception is the SSE pairing stream, which uses a single-use 60-second ticket minted via `POST /wa/link/ticket`.
7. **IDs Are UUIDs**: cloud primary keys are UUIDs; the frontend generates UUID v4 for locally-created rows (`src/utils/uuid.ts`) and repairs legacy non-UUID ids on load (`normalizeLegacyIds`).
8. **Baileys Fork**: `baileys@7.0.0-rc14` with the personal-fork libsignal override in `resolutions`/`overrides` is intentional — do not "upgrade" it away.
