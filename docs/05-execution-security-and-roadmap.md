# BolKhata Execution, Security Architecture, and Roadmap

## 1. Security Architecture & Threat Model

Financial ledger systems require stringent security, multi-tenant isolation, and resilient rate limiting. BolKhata implements defense-in-depth across the mobile client, Express API, and Supabase database.

### 1. Multi-Tenant Data Isolation
- **Row Level Security (RLS)**: Enforced in `schema_v2.sql` across `stores`, `customers`, `transactions`, and `cashbook` tables.
- **Tenant Scoping**: All queries are filtered by `user_id` and `store_id` constraints.
- **Client Storage Scoping**: Local `AsyncStorage` keys are scoped via `userKey(key, userId)` so multiple users on a single device cannot access each other's cached data.

### 2. Authentication & Credential Boundaries
- **Client Bundle Protection**: Only non-sensitive public keys (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`) are embedded in the mobile bundle.
- **Secret Isolation**: Sensitive administrative credentials (`SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `DASHSCOPE_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`) reside exclusively in backend environment variables.
- **Session Tokens**: Client requests to protected backend routes (`/voice/process`, `/voice/tts`) pass the authenticated session JWT in the `Authorization: Bearer <token>` header, verified server-side via `supabase.auth.getUser(token)`.
- **WhatsApp Credential Security**: Baileys session keys, tokens, and encryption materials are stored exclusively on the backend under `wa/<userId>/` and are never exposed over API endpoints.

### 3. API Quota & Rate Limiting (`voiceLimit.middleware.ts`)
- To prevent abuse of costly LLM and STT API credits, requests to `/voice/process` are metered by user ID.
- Default quota: 50 requests per user per calendar day.
- **Developer Bypass**: Developer and admin accounts listed in `DEVELOPER_EMAILS` or flagged with `is_developer: true` in user metadata are granted unrestricted access for development and testing.

---

## 2. Delivered Features & Current Status

BolKhata has accomplished all key hackathon deliverables:

| Feature Area | Status | Implementation Details |
| :--- | :--- | :--- |
| **Voice Entry Dock** | Complete | Persistent bottom navigation dock (`TabBar.tsx`) with central pulsing mic button supporting tap and hold-and-release workflows. |
| **Voice Recording HUD** | Complete | Elevated animated HUD (`VoiceRecordingHUD.tsx`) with real-time timer, pulse waveform, prompt suggestions, and cancel/stop controls. |
| **Speech-to-Text (STT)** | Complete | Groq `whisper-large-v3` with ElevenLabs Scribe fallback for accurate South Asian speech transcription. |
| **Intent Extraction** | Complete | 5 financial intents (`create_transaction`, `update_transaction`, `delete_transaction`, `delete_customer`, `get_balance`) parsed into structured JSON. |
| **Levenshtein Matching** | Complete | Tolerant fuzzy name matching prevents duplicate customer records across phonetically similar names. |
| **Spoken TTS Feedback** | Complete | Alibaba DashScope `qwen3-tts-flash` / ElevenLabs generates spoken confirmation audio played prior to ledger commitment. |
| **Authentication Flow** | Complete | Supabase Auth with PKCE deep links (`bolkhata://`), first-run carousel, store setup wizard, and celebratory animations. |
| **Offline-First Storage** | Complete | User-scoped `AsyncStorage` cache paired with automatic cloud reconciliation against Supabase PostgreSQL. |
| **WhatsApp Automation** | Complete | Baileys v7 WhatsApp Web engine: SSE QR pairing, reminder templates with formatting preview, and scheduled reminder dispatch. |
| **Cashbook (Rokar)** | Complete | Daily shop cash sales and business expense tracking with date filtering and category breakdown. |
| **Business Analytics** | Complete | Analytics dashboard with credit ratios, receivables/payables, and printable PDF statement preview. |
| **Cloud Deployments** | Complete | Heroku and Railway backend deployments, and EAS Cloud Android APK generation (`npm run build:apk`). |

---

## 3. Future Roadmap

1. **Regional Language Expansion**:
   - Add specialized fine-tuned models for regional languages (Pashto, Sindhi, Punjabi, Balochi).
2. **Offline On-Device STT**:
   - Integrate quantized on-device Whisper models via ONNX Runtime for zero-network speech recognition.
3. **Bluetooth Thermal Receipt Printing**:
   - Direct ESC/POS printing for 58mm/80mm thermal receipt printers over Bluetooth.
4. **SMS Gateway Fallback**:
   - Automated GSM/SMS fallback reminders for customers who do not use WhatsApp.
5. **Inventory & Barcode Scanning**:
   - Camera-based barcode scanner for tracking stock quantities alongside ledger sales.
