# BolKhata Backend API, Testing, and Deployment

## 1. Complete Backend REST & SSE API Catalog

All endpoints run on Express 5.2.1 at base URL `http://localhost:3000` (or production URL). Every endpoint below — except `/health`, `/`, and the SSE pairing stream — requires an `Authorization: Bearer <Supabase JWT>` header; the merchant's identity always comes from the verified token, never from URL params or request bodies. Mutating routes validate their payloads with Zod before the controller runs.

### Health & Root
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server uptime, health status, and UTC timestamp |
| `GET` | `/` | API version banner or redirect to web frontend |

### Voice AI Engine
| Method | Endpoint | Description | Request Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/voice/process` | Audio upload or raw text parsing (daily quota enforced via `increment_voice_usage` RPC) | `multipart/form-data` with `audio` (file) or `application/json` `{ text, people, current_date }` |
| `POST` | `/voice/tts` | Generate multilingual speech audio | `application/json` `{ text, voiceId }` |

### WhatsApp Automation Suite (Baileys Engine)
| Method | Endpoint | Description | Details |
| :--- | :--- | :--- | :--- |
| `POST` | `/wa/link/ticket` | Mint a single-use, 60-second SSE pairing ticket | Response `{ ticket, userId, expiresInMs }` |
| `GET` | `/wa/link/:userId?ticket=…` | SSE stream for live QR pairing (spends the ticket) | Event `qr`: `{ qrBase64 }`<br>Event `connected`: `{ phone }` |
| `GET` | `/wa/status` | Check WhatsApp Web connection state | Response `{ linked: boolean, phone?: string }` |
| `DELETE` | `/wa/link` | Unlink account and wipe the `wa/<userId>/` session directory | Response `{ success: true }` |
| `POST` | `/wa/remind` | Send instantaneous payment reminder text | `{ customerId, phone, name, balance, message, storeName, countryCode }` → `{ success, phone, message, sentAt }` |
| `POST` | `/wa/schedule` | Register a future scheduled reminder | `{ customerId, phone, name, balance, scheduledAt, message, storeName, countryCode }` → `{ success, schedule }` |
| `GET` | `/wa/schedule` | List all pending scheduled reminders | Returns array of scheduled reminders |
| `DELETE` | `/wa/schedule/:scheduleId` | Cancel a scheduled reminder | Response `{ success: true }` |
| `GET` | `/wa/history/:jid` | Retrieve message history for a specific customer JID | Returns chat history log |

### Customer & Party Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/customers` | List all customers/suppliers for store with current balances |
| `POST` | `/customers` | Create new customer or supplier with opening balance |
| `GET` | `/customers/:id` | Get customer details and outstanding balance |
| `PUT` | `/customers/:id` | Update customer profile details |
| `DELETE` | `/customers/:id` | Delete customer and cascade delete all transactions |

### Transactions & Ledger
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/transactions` | List transactions (query-validated: `?customer_id=&limit=`) |
| `GET` | `/transactions/customer/:id` | List all entries for one customer |
| `POST` | `/transactions` | Create Gave / Got transaction entry |
| `PUT` | `/transactions/:id` | Edit transaction note, amount, or payment mode |
| `DELETE` | `/transactions/:id` | Delete transaction and recalculate customer balance |

### Dashboard & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard` | Authoritative totals: Net balance, total receivable, total payable |

---

## 2. Testing Strategy & Test Matrix

### Automated Unit Tests (Vitest)
- **Backend** (`cd backend && npm test`): phonetic + Levenshtein fuzzy party matching (`src/utils/matching.test.ts`).
- **Frontend** (`cd frontend && npm test`): ledger math and legacy-id repair (`src/utils/ledger.test.ts`), UUID v4 generation (`src/utils/uuid.test.ts`).
- CI (`.github/workflows/ci.yml`) runs type-check + tests (backend) and lint + type-check + tests (frontend) on every push and pull request.

### Critical Financial Paths
- **Gave Transaction**: Customer balance increases by transaction amount.
- **Got Transaction**: Customer balance decreases by transaction amount.
- **Opening Balance**: Correctly recorded as initial transaction; persists across retroactive edits and recalculations.
- **Settlement**: Creates balancing transaction to bring balance exactly to 0.
- **Deletion**: Deleting a middle transaction recalculates current balance accurately without side effects.

### Voice Engine Edge Cases
- **Colloquial Numerics**: Verify "5 hazar", "derh lakh", "dhai sau" parse to 5000, 150000, 250.
- **Fuzzy Name Matching**: Ensure "Abid Bhai" matches existing contact "Abid" with high confidence.
- **Ambiguous Statements**: Prompts for confirmation rather than guessing.
- **Provider Failover**: When ElevenLabs returns 429/500, Groq Whisper Turbo executes automatically within <1.2s.

---

## 3. Production Deployment Guide

### Backend Docker Deployment (`/backend/Dockerfile`)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Railway Deployment (`/backend/railway.json`)
- Configure Environment Variables on Railway:
  - `PORT=3000`
  - `SUPABASE_URL=https://<project-ref>.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=eyJ...`
  - `GEMINI_API_KEY=AIza...`
  - `DASHSCOPE_API_KEY=sk-...`
  - `GROQ_API_KEY=gsk_...`
  - `ELEVENLABS_API_KEY=sk_...`
  - `FRONTEND_URL=https://bolkhata.app`

### Frontend Mobile Build (EAS Cloud APK)
```bash
cd frontend
# Log in to EAS
npx eas-cli login

# Build standalone Android APK preview
npm run build:apk
```
