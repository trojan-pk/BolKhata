# BolKhata (बोल खाता) — Voice-First Digital Ledger

**BolKhata** is a voice-first digital ledger and shop management app for small shopkeepers. Shopkeepers simply **speak** to record customer purchases (*udhaar*), and the app automatically creates a digital ledger — then sends polite WhatsApp voice reminders for overdue payments.

Built for the **Alibaba Cloud AI Hackathon Pakistan 2026** (Alkhidmat Foundation Pakistan / Bano Qabil ecosystem). Team: **Trojan**.

> **Core value prop**: 1-tap voice entry, offline-first reliability, modern minimalist UI, and AI-powered intent parsing.

## 🎯 Core Flow

```text
🎙️ "Ahmed ne 500 ka saman udhaar liya"
        ↓  Speech-to-Text
   AI understands intent + transaction
        ↓  Ahmed — Rs. 500 — Udhaar
   Shopkeeper confirms
        ↓
   Digital Khata updated
        ↓
   Due payment tracking
        ↓
   WhatsApp voice reminder
```

## 📂 Repository Structure (Monorepo)

```
BolKhata/
├── frontend/                 # React Native (Expo SDK 52) mobile app
│   ├── App.tsx               # App root: tab routing, splash cross-fade, pill dock
│   ├── src/
│   │   ├── components/       # Reusable UI components & modals
│   │   ├── screens/          # Customers, Cashbook, Reports, Settings
│   │   ├── services/         # AsyncStorage persistence & seed data
│   │   ├── theme/            # Color & typography tokens
│   │   └── types/            # TypeScript interfaces
│   └── package.json
├── backend/                  # Express Node.js backend (API connector)
├── docs/                     # Product, technical & execution documentation
│   ├── 01-product-vision.md
│   ├── 02-technical-stack-and-data.md
│   ├── 03-voice-and-mobile-features.md
│   ├── 04-backend-api-testing-and-deployment.md
│   └── 05-execution-security-and-roadmap.md
├── CONTEXT.md                # AI coding assistant context guide
└── AGENTS.md                 # Agent workflow rules
```

## ✨ Frontend Features

- **Khata (Ledger)** — Track Gave (Udhaar / you'll collect) in crimson red and Got (Jama / you'll pay) in emerald green.
- **Customer Directory** — Register customers & suppliers, search, filter, per-customer timelines with WhatsApp reminders.
- **Cashbook** — Daily shop cash sales & expense tracking.
- **Reports** — Business analytics with PDF export preview.
- **Voice Assistant** — Speech-to-entry voice assistant modal.
- **Settings** — Store profile, language & currency settings.
- **Backend Connector** — API config modal to plug in the Express backend.

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React Native with **Expo SDK 52** (Managed Workflow) |
| **Language** | TypeScript (strict) |
| **Web Engine** | React Native Web (`react-dom`, `@expo/metro-runtime`) |
| **Icons** | `lucide-react-native` |
| **Persistence** | `@react-native-async-storage/async-storage` (offline-first) |
| **Backend** | Express Node.js (planned) |
| **Typography** | Plus Jakarta Sans (headings & figures) + Inter (body & subtitles) |

## 🚀 Getting Started

```bash
# Frontend (Expo app)
cd frontend
npm install
npx expo start --web          # Web dev server (port 8081)
npx expo start --android      # Android
npx expo start --ios          # iOS
```

## ✅ Typecheck

```bash
cd frontend
node node_modules/typescript/bin/tsc --noEmit
```

## 📦 Build & Export

```bash
# Android APK via EAS Cloud
eas build --platform android --profile preview

# Static web export
npx expo export -p web
```

## ⚠️ Gotchas

- **Windows Terminal**: Use `npx expo start` (not bare `expo`).
- **Peer dependencies**: `frontend/.npmrc` sets `legacy-peer-deps=true` for React 18 / Expo 52 compatibility.
- **No horizontal scrollbars**: Filter bars use `ScrollView horizontal showsHorizontalScrollIndicator={false}` inside flex parents.

## 📄 License

See [LICENSE](LICENSE).