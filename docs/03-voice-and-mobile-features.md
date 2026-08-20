# BolKhata Voice and Mobile Features

## 13. Voice Entry Workflow

This is the core BolKhata feature.

### Step 1 — Record

User taps:

```text
🎙️ Tap & Speak
```

App requests microphone permission.

Recording state:

```text
🔴 Recording...

"Ahmed ne 500 rupay ka
saman udhaar liya."
```

Then user stops recording.

### Step 2 — Upload

Mobile sends audio to:

```text
POST /voice/process
```

using `multipart/form-data`.

### Step 3 — Speech-to-Text

Backend sends audio to the selected STT service.

STT result:

```text
"Ahmed ne 500 rupay ka saman udhaar liya."
```

### Step 4 — LLM extraction

LLM converts natural language to structured data:

```json
{
  "intent": "ADD_CREDIT",
  "customerName": "Ahmed",
  "amount": 500,
  "description": "saman"
}
```

### Step 5 — Validation

Backend validates:

- Intent is allowed
- Customer exists
- Amount is numeric
- Amount > 0
- Required fields exist

### Step 6 — Confirmation

Before mutation, mobile shows:

```text
Confirm Transaction

Customer
Ahmed

Amount
Rs. 500

Type
Udhaar

Description
Saman

[ Cancel ] [ Confirm ]
```

### Step 7 — Database mutation

Only after confirmation:

```text
POST /transactions
```

Backend creates the transaction.

## 14. Voice Query Workflow

The assistant should also support questions.

Example:

```text
"Ahmed ka kitna udhaar hai?"
```

Pipeline:

```text
Audio
 ↓
STT
 ↓
LLM
 ↓
intent = GET_BALANCE
customer = Ahmed
 ↓
Backend
 ↓
Supabase PostgreSQL
 ↓
balance
 ↓
TTS (optional)
```

Result:

```text
Ahmed ka current udhaar:
Rs. 2,500
```

Optional voice response:

```text
"Ahmed ka current udhaar 2500 rupay hai."
```

## 15. Payment Voice Workflow

Example:

```text
"Ahmed ne 500 rupay wapas de diye."
```

LLM output:

```json
{
  "intent": "ADD_PAYMENT",
  "customerName": "Ahmed",
  "amount": 500
}
```

Backend:

```text
Old balance = 2500
Payment = 500
New balance = 2000
```

Again, backend performs the financial calculation.

## Voice AI Provider Fallback Stack

The Expo app sends audio and text requests only to the Express Voice Service. Provider selection and fallback remain entirely inside the backend.

### STT - Speech to Text

```text
1. Groq + Whisper       -> Primary
2. Deepgram             -> Fallback
3. Self-hosted Whisper  -> Emergency
```

### TTS - Text to Speech

```text
1. Alibaba Qwen TTS       -> Primary
2. Gemini TTS             -> Fallback
3. Deepgram Aura          -> Fallback
4. ElevenLabs             -> Optional
5. Qwen/CosyVoice         -> Self-hosted emergency
```

### Fallback Flow

```text
Voice Request
        ↓
Provider 1
        ↓ failed
Provider 2
        ↓ failed
Provider 3
        ↓ failed
Emergency Local Model
```

### Voice Service Architecture

```text
Expo App
   ↓
Express API
   ↓
Voice Service
   ├── STT Providers
   │    ├── Groq Whisper
   │    ├── Deepgram
   │    └── Local Whisper
   │
   └── TTS Providers
           ├── Alibaba Qwen
           ├── Gemini
           ├── Deepgram
           └── Local Qwen/CosyVoice
```

Core rule: Expo should never directly depend on a specific AI provider. Use a Voice Service plus provider abstraction so models can be changed without rewriting the app.

## 16. Customer Management

Customer list:

```text
Customers

Ahmed
Rs. 2,500 due

Bilal
Rs. 800 due

Usman
Rs. 0
```

Create customer:

```text
Name
Phone
Optional information
```

API:

```text
POST /customers
```

Customer details:

```text
GET /customers/:id
GET /customers/:id/transactions
```

## 17. Dashboard

Suggested dashboard:

```text
Assalam-o-Alaikum 👋
Shopkeeper Name

Total Udhaar
Rs. 48,500

Due Today
Rs. 7,200

🎙️ Add Voice Entry

Recent Transactions

Ahmed     +500
Bilal     +1200
```

API:

```text
GET /dashboard
```

The backend calculates authoritative totals.

## 18. WhatsApp Reminder Workflow

When a customer has an overdue balance:

```text
Outstanding balance
        ↓
Due date / reminder date
        ↓
Reminder scheduler
        ↓
Generate polite message
        ↓
WhatsApp API
        ↓
Customer
```

Example text:

```text
Assalam-o-Alaikum Ahmed bhai, aapka Rs. 2,500 ka baki khata hai. Jab aasani ho payment kar dein. Shukriya.
```

The product's differentiator is also a possible voice reminder:

```text
Reminder text
 ↓
Text-to-Speech
 ↓
Audio
 ↓
WhatsApp
 ↓
Customer receives voice message
```

## 19. AI Voice Assistant Architecture

```text
              🎙️ User
                 │
                 ↓
               Audio
                 │
                 ↓
                STT
                 │
                 ↓
          Natural Language
                 │
                 ↓
                LLM
                 │
        ┌────────┼─────────┐
        ↓        ↓         ↓
    ADD_CREDIT PAYMENT  GET_BALANCE
        │        │        │
        └────────┼─────────┘
                 ↓
          Backend Logic
                 ↓
             Supabase PostgreSQL
                 ↓
             Result JSON
                 ↓
                TTS
                 ↓
                🔊
```

## 20. Mobile App Screens

Recommended MVP screens:

- Splash
- Login
- Signup
- Dashboard
- Customers
- Customer details
- Customer Khata
- Voice assistant
- Transaction confirmation
- Reminders
- Profile/settings

Potential Expo structure:

```text
bolkhata/
│
├── app/
│   ├── index.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   │
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── customers.tsx
│   │   ├── reminders.tsx
│   │   └── profile.tsx
│   │
│   ├── customer/
│   │   └── [id].tsx
│   │
│   └── voice/
│       └── index.tsx
│
├── components/
│   ├── VoiceButton.tsx
│   ├── CustomerCard.tsx
│   ├── TransactionCard.tsx
│   └── BalanceCard.tsx
│
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── voice.ts
│
├── store/
│   └── authStore.ts
│
├── types/
│   ├── customer.ts
│   └── transaction.ts
│
└── utils/
```
