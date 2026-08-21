# BolKhata (بول کھاتا / बोल खाता) — Voice-First Digital Ledger

**BolKhata** is a voice-first digital ledger and shop management app for small shopkeepers. The shopkeeper **speaks** a transaction in Urdu/Hindi, the app transcribes it, extracts the intent with an LLM, and speaks a confirmation back — then the entry lands in a digital *khata* with running balances.

Built for the **Alibaba Cloud AI Hackathon Pakistan 2026** (Alkhidmat Foundation Pakistan / Bano Qabil ecosystem). Team: **Trojan**.

> **Core value prop**: 1-tap voice entry, spoken confirmation in the shopkeeper's own language, modern minimalist UI, and AI-powered intent parsing.

## 🎯 Core Flow

```text
🎙️  "Ahmed ne 500 ka saman udhaar liya"
         │
         ├─ expo-audio records mic → m4a
         ▼
   POST /voice/process  (multipart, field: audio)
         │
         ├─ Groq Whisper large-v3 ........ speech → text
         ├─ Groq llama3-8b-8192 (JSON) ... text → {intent, customerName, amount, type}
         ├─ DashScope qwen3-tts-flash .... confirmation → wav (base64)
         ▼
   App shows parsed entry + plays spoken confirmation
         │
   Shopkeeper taps Confirm
         ▼
   POST /transactions → Supabase, customer balance updated
```

## 📂 Repository Structure (Monorepo)

```
BolKhata/
├── frontend/                       # React Native app — Expo SDK 57
│   ├── App.tsx                     # Clerk gate, tab routing, splash cross-fade, pill dock
│   ├── index.ts                    # registerRootComponent entry
│   ├── app.json                    # Expo config: scheme `bolkhata`, audio permissions
│   ├── babel.config.js             # lucide barrel-import rewrite (see Gotchas)
│   └── src/
│       ├── components/             # Header, DashboardCards, CustomerCard, SplashScreen,
│       │                           # TransactionModal, AddCustomerModal, CustomerDetailModal,
│       │                           # VoiceAssistantModal, ApiConfigModal, VoiceLogo
│       ├── screens/                # AuthScreen, CustomersScreen, CashbookScreen,
│       │                           # ReportsScreen, SettingsScreen
│       ├── services/               # api.ts (axios → Express), storage.ts (unused, see Gaps)
│       ├── theme/                  # colors.ts, typography.ts (+ web Google Fonts injection)
│       ├── types/                  # Party, Transaction, CashbookEntry, StoreProfile
│       └── cache.ts                # Clerk token cache backed by expo-secure-store
├── backend/                        # Express 5 API
│   ├── src/
│   │   ├── server.ts               # app bootstrap, route mounting, health check
│   │   ├── routes/                 # auth, customer, transaction, voice, dashboard
│   │   ├── controllers/            # matching controllers
│   │   ├── middleware/             # auth.middleware.ts (unmounted), errorHandler.ts
│   │   └── services/               # supabase.service.ts
│   └── database/schema.sql         # Postgres DDL for Supabase
├── docs/                           # Product, technical & execution documentation
├── .agents/skills/                 # Vendored Clerk agent skills (setup, custom UI, testing, CLI…)
├── CONTEXT.md                      # AI coding assistant context guide
└── AGENTS.md                       # Agent workflow rules
```

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Mobile / Web** | React Native `0.86.2` on **Expo SDK 57** |
| **UI runtime** | React `19.2.3`, React Native Web `0.21.2`, `@expo/metro-runtime` |
| **Language** | TypeScript strict — frontend `~6.0.3`, backend `^7.0.2` |
| **Auth** | **Clerk** (`@clerk/expo ^4.5.2`) — email+password, Google & GitHub SSO |
| **Token storage** | `expo-secure-store` (native); in-memory on web |
| **Audio** | `expo-audio` — `useAudioRecorder` for capture, `createAudioPlayer` for TTS playback |
| **Icons** | `lucide-react-native` |
| **HTTP client** | `axios` |
| **API** | Express `5.2.1`, `multer` (memory storage) for audio uploads |
| **Database** | Supabase Postgres via `@supabase/supabase-js` |
| **Speech-to-text** | Groq `whisper-large-v3` |
| **Intent parsing** | Groq `llama3-8b-8192` (JSON response mode) |
| **Text-to-speech** | Alibaba DashScope `qwen3-tts-flash` (international endpoint) |
| **Backend dev loop** | `nodemon` + `tsx` |
| **Typography** | Plus Jakarta Sans (headings & figures) + Inter (body & subtitles) |

## ⚙️ Environment Variables

### `frontend/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

`App.tsx` throws at startup if `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing. Only `EXPO_PUBLIC_*` vars are inlined into the client bundle — and they are **baked in at bundle time**, so restart the dev server after editing.

### `backend/.env`

```env
PORT=3000
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
GROQ_API_KEY=            # required — /voice/process 500s without it
DASHSCOPE_API_KEY=       # optional — TTS is skipped (audioBase64: null) if absent
```

Both `.env` files are gitignored. Copy from the checked-in `.env.example` in each package.

## 🚀 Getting Started

```bash
# 1. Backend
cd backend
npm install
npm run dev                   # nodemon + tsx on :3000

# 2. Frontend (separate terminal)
cd frontend
npm install
npx expo start                # press w = web, a = Android, i = iOS
```

Health check: `curl http://localhost:3000/` → `{"status":"ok","message":"BolKhata API is running"}`

### Frontend scripts

| Command | What it does |
| :--- | :--- |
| `npm start` | `expo start` — Metro dev server, interactive platform menu |
| `npm run web` | `expo start --web` — browser on port 8081 |
| `npm run android` | `expo run:android` — **native build**, needs Android SDK |
| `npm run ios` | `expo run:ios` — **native build**, needs Xcode (macOS) |

`expo-dev-client` is installed, so `npx expo start` targets a **development build**, not Expo Go. Build one once with `npm run android` / `npm run ios`; after that `npx expo start` attaches to it. Web needs no native build.

### Backend scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Watch `src/**/*.ts`, restart via `tsx` |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | `node dist/server.js` (run `build` first) |
| `npm test` | Not implemented — exits 1 |

## 🔌 API Reference

Base URL `http://localhost:3000`. **No endpoint currently requires authentication** — see Known Gaps.

| Method | Route | Notes |
| :--- | :--- | :--- |
| `GET` | `/` | Health check |
| `POST` | `/auth/signup` | `501 Not Implemented` |
| `POST` | `/auth/login` | `501 Not Implemented` |
| `GET` | `/auth/me` | `501 Not Implemented` |
| `GET` | `/customers` | List customers |
| `POST` | `/customers` | Create — `{ name, phone }` |
| `GET` | `/customers/:id` | Fetch one |
| `PUT` | `/customers/:id` | Update — `{ name, phone }` |
| `DELETE` | `/customers/:id` | Delete, `204` |
| `POST` | `/transactions` | `{ customer_id, type: 'CREDIT'\|'PAYMENT', amount, description }` → inserts + recomputes balance |
| `GET` | `/transactions/customer/:id` | Customer's transactions, newest first |
| `POST` | `/voice/process` | `multipart/form-data` field `audio`, **or** JSON `{ text }` → `{ intent, customerName, amount, description, type, originalText, audioBase64 }` |
| `GET` | `/dashboard` | `{ totalUdhaar, dueToday }` |

## 🗄️ Data Model

`backend/database/schema.sql` — run it in the Supabase SQL editor.

| Table | Key columns |
| :--- | :--- |
| `users` | `id`, `email` (unique), `phone_number`, `name` |
| `customers` | `id`, `user_id` → `users`, `name`, `phone`, `balance` |
| `transactions` | `id`, `customer_id` → `customers`, `type` (`CREDIT`\|`PAYMENT`), `amount` (>0), `description`, `ai_metadata` (JSONB) |
| `reminders` | `id`, `customer_id`, `amount_due`, `due_date`, `status` (`PENDING`\|`SENT`\|`CANCELLED`) |

**Sign convention** (frontend `src/types/index.ts`): a customer's positive `currentBalance` means *you will collect* (udhaar / `gave`, crimson red); negative means *you will pay* (jama / `got`, emerald green). The backend maps `gave → CREDIT` and `got → PAYMENT`.

## ✨ App Features

- **Home / Khata** — dashboard totals plus recent party list.
- **Customers** — register customers & suppliers, search, filter, per-customer timeline with WhatsApp reminder actions.
- **Cashbook** — daily shop cash-in / cash-out tracking.
- **Reports** — business analytics with a PDF export preview.
- **Voice Assistant** — record from the mic, or tap a sample phrase to run the text path; spoken confirmation before saving.
- **Settings** — store profile, language & currency, Clerk sign-out.
- **Backend Connector** — in-app modal to point the app at a different Express URL.

## 🧪 Testing Login

Clerk **development** instances treat any email containing the `+clerk_test` subaddress as a test address: no message is sent and the verification code is always `424242`. Fictional test phones `+1 (XXX) 555-0100` … `555-0199` work the same way.

A pre-verified test account is already seeded on the dev instance:

```
Email:    admin+clerk_test@bolkhata.dev
Password: TestPass123!
```

Enter those on the **Log In** tab — no OTP, no captcha. To make more accounts, sign up in-app with any `+clerk_test` address and enter `424242` when asked to verify.

> Dev-instance only. Swapping to `pk_live_*` keys makes `+clerk_test` ordinary again and this account will not exist. Delete the seeded user before going to production.

## ✅ Typecheck

```bash
cd frontend && node node_modules/typescript/bin/tsc --noEmit
cd backend  && npx tsc --noEmit
```

Both are clean as of the current tree.

## 📦 Build & Export

```bash
eas build --platform android --profile preview    # Android APK via EAS Cloud
npx expo export -p web                           # Static web export
cd backend && npm run build && npm start         # Compiled API
```

## 🧭 Known Gaps

Honest state of the code — these are deliberate hackathon shortcuts, not hidden bugs.

- **The API is unauthenticated.** `backend/src/middleware/auth.middleware.ts` exports `authenticate`, but no route mounts it. Anyone who can reach the port can read and write every record. Clerk currently gates only the client UI, and the app never sends an `Authorization` header.
- **Tenancy is stubbed.** `customer`, `transaction`, and `dashboard` controllers hardcode `USER_ID = '00000000-0000-0000-0000-000000000000'`. All data belongs to one synthetic user, and the Clerk user ID is never propagated to the backend.
- **`/auth/*` is dead.** All three handlers return `501`; Clerk owns auth client-side.
- **Offline-first is not wired.** `frontend/src/services/storage.ts` (`StorageService`, AsyncStorage-backed) is no longer imported anywhere — `api.ts` replaced it. The app is currently network-dependent.
- **Several `ApiService` methods are stubs.** `getTransactions` returns `[]`; `getCashbook` returns `[]`; `saveParties`, `saveTransactions`, `saveCashbook`, and `saveStoreProfile` are no-ops. Cashbook and transaction history do not persist.
- **`dueToday` is hardcoded to `0`** in the dashboard controller.
- **Reminders are UI-only.** The `reminders` table exists in the schema with no route, controller, or scheduler. WhatsApp voice reminders are not implemented end-to-end.
- **No test suite.** `backend npm test` exits 1; the frontend has no test script.

## ⚠️ Gotchas

- **Windows terminal**: use `npx expo …`, not bare `expo`.
- **Testing on a physical device**: `EXPO_PUBLIC_API_URL=http://localhost:3000` resolves to the *phone*, not your machine. Use your LAN IP (`http://192.168.x.x:3000`) and restart Metro — the value is baked in at bundle time. Android emulator uses `http://10.0.2.2:3000`.
- **Peer dependencies**: `frontend/.npmrc` sets `legacy-peer-deps=true`.
- **lucide icons**: Metro does not tree-shake the 1700-icon barrel, so `babel.config.js` rewrites each named import to `lucide-react-native/icons/<kebab-name>`. Deep `dist/esm/...` paths must **not** be used — package `exports` have been enforced since SDK 53 and would block them.
- **Microphone**: Android permissions are declared in `app.json`; `AudioModule.requestRecordingPermissionsAsync()` must succeed before recording. Mic capture does not work in a plain web browser tab the way it does natively.
- **TTS is optional**: without `DASHSCOPE_API_KEY` the backend logs a warning and returns `audioBase64: null` — parsing still works, just silently.
- **Line endings**: the repo stores LF; git will warn about CRLF conversion on Windows checkouts.

## 📄 License

See [LICENSE](LICENSE).
