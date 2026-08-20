# BolKhata Technical Stack and Data

## 7. Proposed Expo Mobile Stack

### Mobile

- Expo
- React Native
- TypeScript
- Expo Router

### UI

- NativeWind and/or React Native StyleSheet
- Mobile-first UI
- Large touch targets
- Simple navigation
- Readable typography
- Accessible colors
- Shopkeeper-friendly UX
- Minimal cognitive load

### State

- Zustand

### Audio

- Expo audio/recording capabilities

### Secure storage

- Expo SecureStore for sensitive session/token storage

### Navigation

- Expo Router

## 8. Proposed Backend Stack

The current recommended backend for an 8-day hackathon:

- Node.js
- TypeScript
- Express (or Fastify if the team is already comfortable with it)
- Zod for request/response validation
- Supabase for PostgreSQL, Auth, Row Level Security, and optional Storage

Architecture:

```text
Expo / React Native
        ↓
     HTTPS REST
        ↓
Node.js + TypeScript
        ↓
   Business Logic
        ↓
    Supabase
    (PostgreSQL + Auth)
```

## 9. Why Node.js + TypeScript

We discussed whether an AI-heavy voice assistant should use Python/FastAPI instead.

Python is strong for:

- AI/ML
- audio processing
- model experimentation
- custom model inference
- PyTorch
- fine-tuning

However, BolKhata's hackathon MVP is expected to primarily consume hosted AI APIs/services rather than train or host its own model.

The core AI pipeline is:

```text
Audio
 ↓
Speech-to-Text API
 ↓
LLM API
 ↓
Structured JSON
 ↓
Backend business logic
```

This can be implemented very well in Node.js/TypeScript.

Node.js + TypeScript is preferred for the 8-day build because:

- Existing team familiarity
- Strong API ecosystem
- Easy WhatsApp/API integrations
- Type safety
- Less need to introduce another programming ecosystem
- AI APIs can be called directly
- Faster development with Qoder

Python/FastAPI should only be introduced later if the project genuinely requires Python-specific ML/audio processing.

## 10. Database and Supabase Direction

Supabase is the selected platform for the MVP. It provides managed PostgreSQL together with authentication, Row Level Security, Storage, and a practical API layer.

Important clarification:

- MongoDB = NoSQL/document database
- Supabase = managed PostgreSQL platform with Auth, Storage, and Row Level Security
- PostgreSQL = relational database used by Supabase

The earlier alternatives were:

MongoDB Atlas vs PostgreSQL on AWS RDS vs Supabase

### MongoDB strengths

- Flexible document structure
- Natural JSON-like data
- Easy schema changes
- AI-generated JSON is convenient
- Familiar to the team
- Very quick hackathon setup with MongoDB Atlas

### Supabase strengths

- Managed PostgreSQL without separate RDS setup
- Strong relational model
- Foreign keys
- ACID transactions
- Strong consistency
- Excellent for financial transaction data
- Complex queries
- Constraints
- JSONB allows JSON-like flexible data while keeping relational structure
- Supabase Auth and Row Level Security reduce custom authentication work
- Supabase Storage can hold uploaded voice files when persistence is required

BolKhata's data is naturally relational:

```text
Shopkeeper
    ↓
Customers
    ↓
Transactions
    ↓
Payments
    ↓
Reminders
```

### Current recommendation

Use Supabase for the hackathon MVP. Keep Express as the server-side business-logic layer and use Supabase PostgreSQL as the authoritative source for customers, transactions, balances, and reminders.

## 11. Supabase Data Model

Suggested basic tables:

```text
users
customers
transactions
reminders
```

Relationships:

```text
users 1 ──── * customers
customers 1 ──── * transactions
customers 1 ──── * reminders
```

Possible transaction structure:

```text
transactions
-------------------------
id
customer_id
type
amount
description
created_at
ai_metadata JSONB
```

Transaction types:

- CREDIT
- PAYMENT

Balance should be derived from transactions rather than blindly trusting an AI-generated balance.

## 12. Authentication

Recommended:

- JWT-based authentication
- Secure token storage on mobile
- API authorization middleware

Flow:

```text
Expo
 ↓
POST /auth/login
 ↓
Node.js
 ↓
Supabase Auth
 ↓
JWT
 ↓
Expo SecureStore
```

Sensitive credentials/API keys should never be embedded in the mobile app.

Correct:

```text
Flutter/Expo
 ↓
Backend
 ↓
Alibaba/AI provider
```

Incorrect:

```text
Flutter/Expo
 ↓
Direct secret AI API key
```
