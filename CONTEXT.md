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
| **Audio & Media** | `expo-av`, `expo-speech` | High-fidelity voice recording, waveform visualization, and native speech synthesis |
| **Icons** | `lucide-react-native`, `react-icons` | Consistent vector iconography |
| **Typography** | **Google Fonts** | **Plus Jakarta Sans** (Headings, Numerics & Amounts) + **Inter** (Body, Subtitles & Controls) |
| **Design System** | Custom Atomic UI Library (`src/ui`) | `Avatar`, `Button`, `Card`, `Chip`, `CrossFade`, `DrawnCheck`, `EmptyState`, `Feedback`, `Field`, `Headers`, `Money`, `Press`, `Row`, `Segmented`, `Sheet`, `Skeleton` |
| **Internationalization** | Multi-lingual (`src/i18n`) | Roman Urdu (`roman_ur`), Urdu Script (`ur`), English (`en`) |

### 🔙 Backend Layer (`/backend`)
| Technology | Specification | Details |
| :--- | :--- | :--- |
| **Runtime & Server** | **Node.js** + **Express 5.2.1** | TypeScript (`tsx`, `typescript: ^7.0.2`), CORS, JSON parser |
| **Database** | **Supabase PostgreSQL** | Schema v2 multi-tenant relational structure, foreign keys, cascade rules, UUIDs, performance indexes, and Row Level Security (RLS) |
| **WhatsApp Engine** | **Baileys v7** (`@hapi/boom`, `qr-image`) | Direct WhatsApp Web socket connection, QR code streaming via Server-Sent Events (SSE), automated message dispatch, scheduling, and chat history |
| **Speech-to-Text (STT)** | 3-Tier Multi-Provider Failover | **Tier 1**: ElevenLabs Scribe STT (`scribe_v1`)<br>**Tier 2**: Groq Whisper Large v3 Turbo (`whisper-large-v3-turbo`)<br>**Tier 3**: Local / direct text payload |
| **LLM Brain Engine** | 3-Tier Multi-Model Failover | **Tier 1**: Google Gemini Flash Lite (`gemini-flash-lite-latest`)<br>**Tier 2**: Alibaba Cloud DashScope Qwen Turbo (`qwen-turbo`)<br>**Tier 3**: Groq Llama 3.3 70B (`llama-3.3-70b-versatile`) |
| **Validation & Safety** | `zod`, `multer`, Rate Limiting | In-memory voice request rate limiter, file buffer validation, structured JSON parsing, and Levenshtein fuzzy party name matcher |

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
│   ├── eas.json                # EAS Build configuration for Android/iOS
│   └── src/
│       ├── components/         # Reusable feature modals & complex components
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
│           └── format.ts                # Currency, phone, and date formatters
│
└── backend/                    # Express Node.js & TypeScript API server
    ├── Dockerfile              # Production container build definition
    ├── Procfile                # Heroku / Railway deployment process
    ├── railway.json            # Railway deployment configuration
    ├── package.json            # Backend dependencies & npm scripts
    ├── tsconfig.json           # TypeScript configuration
    └── src/
        ├── server.ts           # Express application setup, CORS, routes & graceful shutdown
        ├── controllers/        # Business logic controllers
        │   ├── auth.controller.ts       # Authentication controller
        │   ├── customer.controller.ts   # Customer CRUD & balance recalculation
        │   ├── dashboard.controller.ts  # Authoritative dashboard totals aggregation
        │   ├── transaction.controller.ts# Transaction creation & ledger integrity
        │   ├── voice.controller.ts      # Multi-provider STT & LLM intent parsing
        │   └── whatsapp.controller.ts   # Baileys WhatsApp linking, reminders & scheduling
        ├── database/           # SQL schema definitions
        │   ├── schema.sql               # Legacy schema definition
        │   └── schema_v2.sql            # Clean production multi-tenant schema with RLS & indexes
        ├── middleware/         # Express middleware
        │   ├── auth.middleware.ts       # Supabase JWT token verification
        │   ├── errorHandler.ts          # Centralized error handler
        │   └── voiceLimit.middleware.ts # Voice endpoint rate limiting
        ├── routes/             # Express route declarations
        │   ├── auth.routes.ts           # `/auth/*`
        │   ├── customer.routes.ts       # `/customers/*`
        │   ├── dashboard.routes.ts      # `/dashboard/*`
        │   ├── transaction.routes.ts    # `/transactions/*`
        │   ├── voice.routes.ts          # `/voice/*`
        │   └── whatsapp.routes.ts       # `/wa/*`
        ├── services/           # External service connectors
        │   ├── supabase.service.ts      # Supabase client connector
        │   └── whatsapp.service.ts      # Baileys WhatsApp connection, SSE QR streamer, and scheduler
        └── types/              # Backend TypeScript types
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

# Start Production Server
npm run start
```

---

## ⚠️ Gotchas & Execution Rules

1. **Monorepo Commands**: Always ensure you are inside either `frontend/` or `backend/` before running npm commands.
2. **Deterministic Ledger Math**: Never allow the LLM to directly calculate account balances or mutate the database. The LLM extracts intent and parameters; backend / local ledger services calculate balances authoritatively.
3. **Fuzzy Customer Matching**: Voice statements like *"Ali ko 500 diye"* are matched against existing customers using Levenshtein distance before prompting to create a new customer.
4. **WhatsApp Session Storage**: WhatsApp Web sessions are managed on the backend using Baileys inside `.baileys_auth_*` directories and must never be exposed to the client.
5. **Multi-Tenant Scoping**: All Supabase database tables (`stores`, `customers`, `transactions`, `cashbook`) contain `user_id` and `store_id` columns with RLS enabled.
