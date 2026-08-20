# BolKhata Backend, API, Testing, and Deployment

## 21. Backend Structure

Suggested structure:

```text
backend/
│
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── transaction.controller.ts
│   │   └── voice.controller.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── transaction.routes.ts
│   │   └── voice.routes.ts
│   │
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── speech.service.ts
│   │   ├── tts.service.ts
│   │   └── whatsapp.service.ts       # Baileys WhatsApp integration
│   │
│   ├── services/voice/
│   │   ├── voice.service.ts
│   │   ├── providers/
│   │   │   ├── groq.ts
│   │   │   ├── deepgram.ts
│   │   │   ├── alibaba.ts
│   │   │   └── gemini.ts
│   │   └── router.ts
│   │
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── customer.model.ts
│   │   └── transaction.model.ts
│   │
│   ├── middleware/
│   │   └── auth.middleware.ts
│   │
│   └── server.ts
│
└── package.json
```

Supabase provides the PostgreSQL database, Auth, Row Level Security, and optional Storage. Express remains responsible for business logic and the Voice Service provider abstraction.

### WhatsApp Integration

Use **Baileys** in the backend for WhatsApp messaging and reminder delivery. Keep the integration inside `whatsapp.service.ts`; the Expo app communicates only with the authenticated Express API.

```text
Express API
      ↓
whatsapp.service.ts
      ↓
Baileys
      ↓
WhatsApp
```

WhatsApp session credentials and related secrets must remain on the backend and must never be bundled into the mobile app.

## 22. Suggested API Endpoints

### Authentication

```text
POST /auth/signup
POST /auth/login
GET  /auth/me
```

### Customers

```text
GET    /customers
POST   /customers
GET    /customers/:id
PUT    /customers/:id
DELETE /customers/:id
```

### Transactions

```text
POST /transactions
GET  /customers/:id/transactions
```

### Voice

```text
POST /voice/process
```

### Dashboard

```text
GET /dashboard
```

### Reminders

```text
GET  /reminders
POST /reminders/send
```

## 23. Testing Strategy

With 8 days, don't chase excessive coverage.

Focus on critical paths.

### Backend

Test:

- `POST /auth`
- `POST /voice/process`
- `POST /transactions`
- `GET /customers`
- `GET /customers/:id/khata`
- `POST /reminders`

### Critical financial tests

- 500 credit
- 500 payment
- multiple transactions
- unknown customer
- duplicate transaction
- invalid amount
- zero amount
- negative amount
- STT failure
- LLM failure
- WhatsApp failure

### Mobile

Test:

- Login
- Dashboard
- Voice recording
- Microphone permission
- Transaction confirmation
- Customer Khata
- Reminder

Also perform extensive real-device testing.

## 24. Deployment

Potential architecture:

```text
Expo Mobile App
      ↓
Node.js + Express Backend
      ↓
Supabase
      (PostgreSQL + Auth)
```

Backend can be deployed on:

- Railway
- Render
- Another managed platform

Mobile can be built as:

- Android APK
- Android AAB

For hackathon demo, an APK installed on a real Android phone is sufficient if the rules allow it.
