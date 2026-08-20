# BolKhata (बोल खाता) — AI Assistant Context Guide

Welcome! This document provides complete architectural, functional, and technical context for AI coding assistants working on the **BolKhata** repository.

---

## 📌 Project Overview

**BolKhata** is a **Voice-First Digital Ledger & Shop Management App** tailored for retail store owners and shopkeepers. It simplifies bookkeeping for credit (*Udhaar / Gave*) and debit (*Jama / Got*) transactions, daily cashbook sales, and business reporting.

- **Primary Persona**: Retail store owners (grocery, Kirana, hardware, clothing shops).
- **Core Value Prop**: 1-tap voice entry, offline-first reliability, modern minimalist UI, and Express API backend integration capabilities.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | **React Native** with **Expo SDK 52** (Managed Workflow) |
| **Language** | **TypeScript** (Strict Type Definitions) |
| **Web Engine** | **React Native Web** (`react-dom`, `@expo/metro-runtime`) |
| **Icons** | `lucide-react-native` |
| **Persistence** | `@react-native-async-storage/async-storage` (Offline-first) |
| **Typography** | **Plus Jakarta Sans** (Headings & Figures) + **Inter** (Body & Subtitles) |

---

## 📂 Codebase Structure

```
BolKhata-App/
├── App.tsx                     # Main app root: Tab routing, Splash cross-fade, Pill dock
├── index.ts                    # Expo application entry point
├── package.json                # Project dependencies and Expo scripts
├── tsconfig.json               # TypeScript compiler config
├── .gitignore                  # Exclusion rules for git
├── CONTEXT.md                  # AI Context documentation (this file)
└── src/
    ├── components/             # Reusable UI components & Modals
    │   ├── VoiceLogo.tsx       # Animated 5-bar voice signal equalizer logo (Black)
    │   ├── SplashScreen.tsx    # Minimal loading screen with letter-by-letter reveal
    │   ├── Header.tsx          # Store header with brand badge
    │   ├── DashboardCards.tsx  # Net Khata balance, Receivable/Payable, Cashbook strip
    │   ├── CustomerCard.tsx    # Customer list card item with balance badge
    │   ├── CustomerDetailModal.tsx # Customer transaction timeline & WhatsApp reminder
    │   ├── TransactionModal.tsx    # Form to add Gave (Udhaar) / Got (Jama) entry
    │   ├── AddCustomerModal.tsx   # Form to register new customer or supplier
    │   ├── VoiceAssistantModal.tsx# Speech-to-entry simulated voice assistant
    │   └── ApiConfigModal.tsx     # Express Node.js backend connector setup
    ├── screens/                # Main tab views
    │   ├── CustomersScreen.tsx # Grahak directory with search & filter pills
    │   ├── CashbookScreen.tsx  # Daily shop cash sales & expense tracker
    │   ├── ReportsScreen.tsx   # Business analytics & PDF export preview
    │   └── SettingsScreen.tsx  # Store profile, language & currency settings
    ├── services/
    │   └── storage.ts          # AsyncStorage persistence layer & realistic seed data
    ├── theme/
    │   ├── colors.ts           # Color tokens (Gave Red, Got Green, Primary Black)
    │   └── typography.ts       # Font tokens (Plus Jakarta Sans & Inter with web preconnect)
    └── types/
        └── index.ts            # TypeScript interfaces (Party, Transaction, Cashbook, Store)
```

---

## 🎨 Design System & UI Principles

1. **Theme**: Light theme interface (`#ffffff` canvas, slate text `#0f172a`, hairline borders `#e2e8f0`).
2. **Color Palette**:
   - **Gave (Udhaar / You'll Collect)**: Crimson Red (`#E11D48`)
   - **Got (Jama / You'll Pay)**: Emerald Green (`#16A34A`)
   - **Primary Brand / Dark Accents**: Rich Black (`#000000` / `#0f172a`)
3. **Typography**:
   - `FONTS.headingBold` / `FONTS.headingExtraBold`: Plus Jakarta Sans for titles, headers, and numeric balances.
   - `FONTS.bodyRegular` / `FONTS.bodyMedium` / `FONTS.bodySemiBold`: Inter for phone numbers, dates, notes, and tags.
4. **Navigation**:
   - Floating Dark-Themed Animated Pill Dock (`#0f172a`) with a smooth spring-animated active indicator and a central white voice microphone action button.

---

## 🚀 Key Commands

### Development
```bash
# Start Web Dev Server (Port 8081)
npx expo start --web

# Typecheck whole project
node node_modules/typescript/bin/tsc --noEmit
```

### Build & Export
```bash
# Build Android APK via EAS Cloud
eas build --platform android --profile preview

# Export static web bundle
npx expo export -p web
```

---

## ⚠️ Gotchas & Execution Rules

1. **Windows Terminal**: On Windows PowerShell / CMD, always run commands using `npx expo start` instead of running `expo` directly.
2. **Peer Dependencies**: `.npmrc` is configured with `legacy-peer-deps=true` for React 18 / Expo 52 compatibility.
3. **No Horizontal Scrollbars**: Horizontal filter bars use `<ScrollView horizontal showsHorizontalScrollIndicator={false}>` inside flex parents to prevent viewport horizontal overflow.
