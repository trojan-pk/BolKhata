# BolKhata Backend API, Testing, and Deployment

## 1. Complete Backend REST & SSE API Catalog

All endpoints run on Express 5.2.1 at base URL `http://localhost:3000` (or production URL).

### Health & Root
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server uptime, health status, and UTC timestamp |
| `GET` | `/` | API version banner or redirect to web frontend |

### Voice AI Engine
| Method | Endpoint | Description | Request Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/voice/process` | Audio upload or raw text parsing | `multipart/form-data` with `file` (audio) or `application/json` `{ text, people, current_date }` |
| `POST` | `/voice/tts` | Generate multilingual speech audio | `application/json` `{ text, voiceId }` |

### WhatsApp Automation Suite (Baileys Engine)
| Method | Endpoint | Description | Details |
| :--- | :--- | :--- | :--- |
| `GET` | `/wa/link/:userId` | Server-Sent Events (SSE) stream for live QR pairing | Event `qr`: `{ qrBase64 }`<br>Event `connected`: `{ phone }` |
| `GET` | `/wa/status/:userId` | Check WhatsApp Web connection state | Response `{ linked: boolean, phone?: string }` |
| `DELETE` | `/wa/link/:userId` | Unlink account and wipe `.baileys_auth_*` directory | Response `{ success: true }` |
| `POST` | `/wa/remind` | Send instantaneous payment reminder text | `{ userId, customerId, phone, name, balance, message, storeName }` |
| `POST` | `/wa/schedule` | Register a future scheduled reminder | `{ userId, customerId, phone, name, balance, scheduledAt, message, storeName }` |
| `GET` | `/wa/schedule/:userId` | List all pending scheduled reminders | Returns array of scheduled reminders |
| `DELETE` | `/wa/schedule/:userId/:scheduleId` | Cancel a scheduled reminder | Response `{ success: true }` |
| `GET` | `/wa/history/:userId/:jid` | Retrieve message history for a specific customer JID | Returns chat history log |

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
| `GET` | `/transactions` | List recent transactions (filterable by customer ID) |
| `POST` | `/transactions` | Create Gave / Got transaction entry |
| `PUT` | `/transactions/:id` | Edit transaction note, amount, or payment mode |
| `DELETE` | `/transactions/:id` | Delete transaction and recalculate customer balance |

### Dashboard & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard/summary` | Authoritative totals: Net balance, total receivable, total payable |

---

## 2. Testing Strategy & Test Matrix

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
