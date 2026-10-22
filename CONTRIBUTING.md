# Contributing to BolKhata

Thanks for your interest in contributing to **BolKhata**! We welcome bug reports, feature ideas, architectural discussions, documentation improvements, and pull requests.

---

## 1. Before You Start

- Read our [Code of Conduct](file:///d:/My-Github-Projects/BolKhata/CODE_OF_CONDUCT.md).
- Search existing issues and PRs before opening a new one to avoid duplicate work.
- Review the project documentation:
  - [README.md](file:///d:/My-Github-Projects/BolKhata/README.md) - Project overview, features, and setup.
  - [CONTEXT.md](file:///d:/My-Github-Projects/BolKhata/CONTEXT.md) - Architectural context, component trees, and data models.
  - [EAS_BUILD.md](file:///d:/My-Github-Projects/BolKhata/EAS_BUILD.md) - EAS Cloud Build setup and APK generation.
  - [auth.md](file:///d:/My-Github-Projects/BolKhata/auth.md) - Supabase authentication and session security.
  - [docs/](file:///d:/My-Github-Projects/BolKhata/docs) - Technical deep-dive documentation (product vision, data layer, voice HUD, backend API catalog, security).

---

## 2. Tech Stack & Repository Structure

BolKhata is a TypeScript monorepo consisting of:
- **`frontend/`**: React Native mobile app powered by Expo SDK `~58.0.0` (React `19.3.0`, React Native `0.88.0`), featuring a floating bottom tab bar with an elevated voice dock button, real-time waveform recording HUD, and user-scoped local storage.
- **`backend/`**: Node.js 22 + Express `5.2.1` microservice orchestrating multi-tier speech-to-text (ElevenLabs Scribe / Groq Whisper), multi-model intent parsing (Gemini 2.5 Flash Lite / DashScope Qwen / Groq Llama 3.3), DashScope TTS, and a Baileys v7 WhatsApp engine.
- **`docs/`**: Comprehensive system design and architectural specification guides.

---

## 3. Development Setup

### Prerequisites
- **Node.js**: v20+ or v22 LTS (recommended: `Node 22.14.0` to match EAS cloud builds).
- **npm**: v10+ package manager.
- **Expo CLI**: `npx expo <command>` (comes bundled with Expo SDK).
- **EAS CLI**: (Optional, for Android APK builds) `npm install -g eas-cli`.
- **Android SDK & Java 17**: Required only if compiling native Android builds locally.

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (note --legacy-peer-deps for React 19)
cd ../frontend
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables

#### Backend `.env` (`backend/.env`)
Create `backend/.env` with the following keys:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=your_jwt_secret_here

# AI & Voice Providers
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
DASHSCOPE_API_KEY=sk-...
ELEVENLABS_API_KEY=sk_...

# Rate Limiting & Developer Access
DAILY_VOICE_LIMIT=20
DEVELOPER_EMAILS=your.email@example.com
```

#### Frontend `.env` (`frontend/.env`)
Create `frontend/.env` with the following keys:
```env
# Point to your local network IP during development (e.g., http://192.168.1.X:3000)
# Or use the production Heroku URL: https://bolkhata-api-241d1d60fc07.herokuapp.com
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# Supabase Client Configuration
EXPO_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Step 3: Run the Application Locally

```bash
# Terminal 1 - Start Backend API Server
cd backend
npm run dev

# Terminal 2 - Start Frontend Metro Bundler
cd frontend
npx expo start
```

Press `a` in the Metro terminal to launch on a connected Android device/emulator, or scan the QR code with Expo Go.

---

## 4. Verification Checklist

Always run type checks and build validations before committing:

```bash
# 1. Frontend TypeScript Validation
cd frontend
npm run type-check

# 2. Backend TypeScript Build
cd ../backend
npm run build

# 3. Test Backend Health Endpoint
curl http://localhost:3000/health
```

Both commands should succeed with `exit code 0`.

---

## 5. Contribution Guidelines

1. **Branching**: Branch off `main` using descriptive branch names (`feat/feature-name`, `fix/bug-description`, `docs/doc-update`).
2. **Deterministic Ledger Math**: Never delegate financial calculations or balance adjustments to AI models. All ledger balance math must be calculated deterministically in TypeScript and verified against `schema_v2.sql`.
3. **Multi-Tenant Boundaries**: Every database query must filter by `store_id` (derived from `req.user.id` authenticated via Supabase JWT Bearer token).
4. **Voice UX**: Any voice feature modifications must integrate with the persistent bottom [TabBar.tsx](file:///d:/My-Github-Projects/BolKhata/frontend/src/components/TabBar.tsx) center microphone dock and respect the [VoiceRecordingHUD.tsx](file:///d:/My-Github-Projects/BolKhata/frontend/src/components/VoiceRecordingHUD.tsx) lifecycle.
5. **Documentation Integrity**: When updating APIs, schemas, or components, update the corresponding markdown files in `docs/` and root documentation.

---

## 6. Pull Request Checklist

When submitting a PR:
- [ ] PR title is descriptive and follows conventional commit style (`feat:`, `fix:`, `docs:`, `refactor:`).
- [ ] Code passes `npm run type-check` (frontend) and `npm run build` (backend).
- [ ] No secrets or sensitive `.env` files are committed.
- [ ] Relevant documentation files have been updated.
- [ ] Screenshots or recordings are provided for UI changes.

Thank you for contributing to BolKhata!
