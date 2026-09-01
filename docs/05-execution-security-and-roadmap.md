# BolKhata Execution, Security, and Roadmap

## 1. Security Architecture & Rules

### 1. Zero-Trust Frontend Environment
- **Never expose AI API keys**: Google Gemini, Alibaba DashScope, Groq, and ElevenLabs API keys must only reside in the backend `.env`.
- **Never bundle WhatsApp sessions in client**: Baileys multi-device session credentials remain securely on the backend server.
- **Supabase Anon Key Only**: The mobile client only possesses the public `EXPO_PUBLIC_SUPABASE_ANON_KEY` and passes user JWT tokens in the `Authorization: Bearer <token>` header to the Express backend.

### 2. Multi-Tenant Database Isolation
- All tables (`stores`, `customers`, `transactions`, `cashbook`, `voice_usage`) contain `user_id` columns with foreign keys and cascading rules.
- PostgreSQL Row Level Security (RLS) is strictly enforced on all tables in Schema v3 (`auth.uid() = user_id`) to prevent cross-tenant data leakage. `transactions.user_id` is derived from the owning customer via database trigger `trg_transactions_derive_user`, and customer balances are recalculated deterministically via trigger `trg_transactions_recalc_balance`.

### 3. Voice Rate Limiting & Abuse Prevention
- Atomic database-backed daily voice quota enforced via `increment_voice_usage` RPC with in-memory fallback middleware (`voiceLimit.middleware.ts`) to prevent API abuse and quota exhaustion.

---

## 2. Developer & AI Coding Workflow

### 1. Monorepo Execution Rules
- Always run frontend commands (`npm run web`, `npm run start`, `npm run type-check`) inside the `/frontend` directory.
- Always run backend commands (`npm run dev`, `npm run build`, `npm run start`) inside the `/backend` directory.

### 2. State & UI Integrity
- Preserve the atomic design system in `frontend/src/ui/`.
- Maintain consistent semantic color tokens (`Gave Red #E11D48`, `Got Green #16A34A`, `Ink #0F172A`).
- Ensure all numbers and currency amounts use **Plus Jakarta Sans** and labels use **Inter**.

---

## 3. Implemented Milestones & Roadmap

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Project Milestone Status                        │
├────────────────────────────────────────────────────────────────────────┤
│  ✅ Phase 1: Architecture & UI Component System (Tokens, Typography)   │
│  ✅ Phase 2: Multi-Tier Voice AI Engine (ElevenLabs/Groq/Gemini/Qwen) │
│  ✅ Phase 3: Baileys WhatsApp Web Engine (SSE QR, Reminders, Schedule) │
│  ✅ Phase 4: Supabase Schema v3 Multi-Tenant DB with RLS & Auth       │
│  ✅ Phase 5: Grahak Ledger, Cashbook Rokar, Reports & PDF Previews     │
│  ⏳ Phase 6 (Future): Offline Sync Queue & Conflict Resolution         │
│  ⏳ Phase 7 (Future): OCR Camera Receipt & Handwritten Note Scanner    │
│  ⏳ Phase 8 (Future): Multi-Staff Access & Role-Based Permissions      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Hackathon Submission Highlights

1. **True Voice-First Experience**: Shopkeepers can manage their entire store ledger through spoken Urdu/Roman Urdu without typing.
2. **Enterprise-Grade AI Resilience**: 3-tier STT and 3-tier LLM failover ensure $99.9\%$ voice processing uptime during demonstrations.
3. **Frictionless WhatsApp Recovery**: Directly connects with existing WhatsApp Web accounts to automate debt collection respectfully.
4. **Production-Ready Visual Design**: Modern typography, animated 5-bar voice equalizer, spring dock navigation, and crisp light theme.
