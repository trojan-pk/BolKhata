# BolKhata Backend API, Testing, and Deployment Architecture

## 1. Backend Architecture & Directory Structure

The BolKhata backend is a modular Express 5 application written in TypeScript and executed on Node.js 22 LTS:

```text
backend/
├── src/
│   ├── server.ts               # App entry point, CORS, routes, graceful shutdown
│   ├── routes/
│   │   ├── auth.routes.ts      # Authentication endpoints
│   │   ├── customer.routes.ts  # Customer management endpoints
│   │   ├── transaction.routes.ts # Transaction ledger endpoints
│   │   ├── voice.routes.ts     # Voice processing & TTS generation endpoints
│   │   ├── dashboard.routes.ts # Analytics and metrics endpoints
│   │   └── whatsapp.routes.ts  # Baileys WhatsApp Web QR & messaging endpoints
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── transaction.controller.ts
│   │   ├── voice.controller.ts # Speech transcription, intent extraction, fuzzy match
│   │   ├── dashboard.controller.ts
│   │   └── whatsapp.controller.ts # SSE QR emitter, instant & scheduled reminders
│   ├── middleware/
│   │   ├── auth.middleware.ts  # Supabase Bearer token verification
│   │   ├── voiceLimit.middleware.ts # Daily voice processing quota & dev bypass
│   │   └── errorHandler.ts     # Global JSON error response handler
│   ├── services/
│   │   ├── supabase.service.ts # Supabase Admin client (PostgreSQL & Auth)
│   │   └── whatsapp.service.ts # Baileys v7 socket, credentials, messaging, scheduler
│   ├── database/
│   │   ├── schema_v2.sql       # Multi-tenant schema with RLS & indexes
│   │   └── schema.sql          # Base legacy schema
│   └── types/
│       └── qr-image.d.ts       # Type definitions for qr-image library
├── Dockerfile                  # Multi-stage production container build (node:22-alpine)
├── Procfile                    # Heroku process declaration
├── railway.json                # Railway build & restart policy configuration
├── .npmrc                      # allow-git=true for Baileys libsignal dependency
└── package.json                # Dependencies, engines, and npm scripts
```

---

## 2. API Endpoint Catalog

Base URL: `http://localhost:3000` (Local) / `https://bolkhata-api-241d1d60fc07.herokuapp.com` (Production)

### System & Health Endpoints
- `GET /health`: Returns JSON with server status, uptime in seconds, and ISO timestamp.
- `GET /`: Returns API metadata and version (`2.0.0`), or redirects to web frontend if accessed via browser.

### Voice Processing Endpoints (`/voice`)
- `POST /voice/process`:
  - **Middleware**: `authenticate`, `voiceLimitMiddleware`, `multer.single('audio')`.
  - **Input**: `multipart/form-data` with `audio` binary file, or JSON with `{ text, people, current_date }`.
  - **Output**: JSON containing:
    ```json
    {
      "intent": "create_transaction",
      "person": { "name": "Ahmed" },
      "transaction": { "direction": "gave", "amount": 500, "reason": "saman" },
      "matchedCustomer": { "id": "p_...", "name": "Ahmed", "phone": "03001234567" },
      "audioBase64": "UklGR..."
    }
    ```
- `POST /voice/tts`:
  - **Middleware**: `authenticate`.
  - **Input**: JSON with `{ text, voiceId }`.
  - **Output**: JSON with `{ audioBase64 }`.

### Customer Endpoints (`/customers`)
- `GET /customers`: Returns array of customer records for active store.
- `POST /customers`: Creates customer (`name`, `phone`).
- `GET /customers/:id`: Fetches customer by UUID.
- `PUT /customers/:id`: Updates customer name and phone.
- `DELETE /customers/:id`: Deletes customer record.

### Transaction Endpoints (`/transactions`)
- `POST /transactions`: Creates new transaction (`customer_id`, `type`, `amount`, `description`) and updates customer balance.
- `GET /transactions/customer/:id`: Fetches transaction ledger history for customer, sorted newest first.

### Dashboard Endpoints (`/dashboard`)
- `GET /dashboard`: Returns financial summary metrics (`totalUdhaar`, `dueToday`).

### WhatsApp Automation Endpoints (`/wa`)
- `GET /wa/link/:userId`: Server-Sent Events (SSE) connection that emits QR code PNG data for scanning.
- `GET /wa/status/:userId`: Returns connection status (`{ linked: boolean, phone?: string }`).
- `DELETE /wa/link/:userId`: Unlinks active session and wipes `wa/<userId>/` credentials.
- `POST /wa/remind`: Sends instant WhatsApp message (`userId`, `customerId`, `phone`, `name`, `balance`, `message`).
- `POST /wa/schedule`: Creates a scheduled future reminder (`userId`, `customerId`, `phone`, `balance`, `scheduledAt`, `message`).
- `GET /wa/schedule/:userId`: Retrieves all pending scheduled reminders for the user.
- `DELETE /wa/schedule/:userId/:scheduleId`: Cancels scheduled reminder.
- `GET /wa/history/:userId/:jid`: Retrieves recorded message history for specified contact.

---

## 3. Middleware Architecture

### 1. `auth.middleware.ts`
Inspects the `Authorization: Bearer <token>` header, verifies the token against `supabase.auth.getUser(token)`, and attaches the authenticated user record to `req.user`.

### 2. `voiceLimit.middleware.ts`
Enforces a daily request quota (default 50 requests/day per user) to protect LLM/STT token usage:
- In-memory usage cache tracks user request counts per calendar day.
- **Developer & Admin Bypass**: Bypasses the limit if the user's email matches `DEVELOPER_EMAILS` (e.g. `talhairfan1947@gmail.com`), ends with `@bolkhata.com`, or has `is_developer: true` / `role: 'admin'` in Supabase metadata.

### 3. `errorHandler.ts`
Catches unhandled errors and returns structured JSON responses with appropriate HTTP status codes:
```json
{
  "error": "Descriptive error message",
  "status": 500
}
```

---

## 4. Production Deployment & CI/CD

### Deploying to Heroku
BolKhata's backend is configured with Heroku Node 22 buildpacks:
- `backend/Procfile`: `web: npm start`
- `backend/package.json`: `heroku-postbuild: npm run build`
- `backend/.npmrc`: `allow-git=true` (permits Git dependencies such as Baileys libsignal)
- Production URL: `https://bolkhata-api-241d1d60fc07.herokuapp.com`

### Deploying to Railway
Railway uses the multi-stage `Dockerfile`:
- **Stage 1 (Builder)**: `node:22-alpine`, installs dependencies (`npm ci`), runs TypeScript compiler (`npm run build`).
- **Stage 2 (Runner)**: `node:22-alpine`, copies compiled `dist/` and runs production dependencies (`npm ci --omit=dev`).
- Production URL: `https://bolkhata-production-6447.up.railway.app`

### Mobile Deployment via EAS Build
- Trigger Android preview APK build:
  ```bash
  cd frontend && npm run build:apk
  ```
- EAS Cloud compiles the managed Expo app on Android Build Image with Java 17, injecting `EXPO_PUBLIC_API_URL` and Supabase credentials.

---

## 5. Verification & Testing Commands

### Backend Verification
```bash
# Type check backend
cd backend && npx tsc --noEmit

# Test health check
curl http://localhost:3000/health

# Test voice health endpoint
curl -X POST http://localhost:3000/voice/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"text":"Ali ko 500 diye"}'
```

### Frontend Verification
```bash
# Type check frontend
cd frontend && npm run type-check

# Test web build export
cd frontend && npm run build
```
