# BolKhata Product Vision & Core Architecture

## 1. Project Overview

- **Project**: BolKhata (बोल खाता / بول کھاتہ)
- **Team**: Trojan
- **Hackathon**: Alibaba Cloud AI Hackathon Pakistan 2026 (Alkhidmat Foundation Pakistan / Bano Qabil ecosystem).

### Original Pitch & Problem Statement
Small shopkeepers, Kirana store owners, and local traders in South Asia maintain manual paper notebooks (*Khatas*) to record credit (*Udhaar / Gave*) and payments (*Jama / Got*). Manual bookkeeping leads to lost records, calculation errors, and awkward debt collection conversations.

**BolKhata** solves this with a **Voice-First AI Ledger**:
1. **Speak naturally in Roman Urdu, Urdu, Hindi, or English**: Record transactions in seconds without typing.
2. **Instant Ledger Structuring**: AI extracts customer names, amounts, transaction directions, and items.
3. **Automated Polite WhatsApp Reminders**: Direct WhatsApp Web automation powered by Baileys sends customized, respectful payment reminders with 1 tap or on a schedule.
4. **Daily Cashbook (Rokar)**: Track all daily cash sales and store expenses.
5. **Business Analytics & PDF Reports**: Real-time receivable vs. payable summaries and statements.

---

## 2. Core User Experience & Life Cycle

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      First-Run & Onboarding Flow                        │
│                                                                         │
│  [Intro Screen] ──> [Welcome Screen] ──> [Supabase Auth]                │
│  (3-slide pitch)    (Login/Signup)       (Email / Google OAuth)         │
│                                                   │                     │
│  [Home Dashboard] <── [Setup Celebration] <── [Onboarding Wizard]       │
│                        (Animated handoff)     (Store, Name, Category)   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Voice Transaction Lifecycle
```text
🎙️ Shopkeeper speaks: "Ahmed ne 500 ka saman udhaar liya"
         ↓
  3-Tier Speech-to-Text (ElevenLabs Scribe -> Groq Whisper -> Local)
         ↓
  3-Tier LLM Brain (Gemini Flash Lite -> DashScope Qwen -> Groq Llama 3.3)
         ↓
  Extracted JSON: { intent: "create_transaction", person: "Ahmed", amount: 500, direction: "gave" }
         ↓
  Fuzzy Customer Matching (Levenshtein distance against existing contacts)
         ↓
  Interactive Confirmation Modal (Shopkeeper reviews and confirms)
         ↓
  Authoritative Ledger Update (Recalculate balance deterministically)
         ↓
  Overdue Payment Tracking & WhatsApp Reminder Dispatch (via Baileys)
```

---

## 3. Core Product Principles

### 1. Deterministic Ledger Math
The Large Language Model is **never** permitted to directly mutate the database or perform arithmetic.
- **LLM Responsibility**: Parse intent, extract customer name, amount, direction (*gave/got*), and note.
- **Backend / Client Responsibility**: Validate amounts ($> 0$), verify customer existence, compute balances ($\text{Balance} = \sum \text{Gave} - \sum \text{Got}$), and commit changes.

### 2. Multi-Tier AI Provider Redundancy
Voice recording must work reliably even if a specific AI cloud service experiences rate limits or downtime. The backend automatically cascades between primary, secondary, and tertiary providers.

### 3. Native WhatsApp Web Automation
Instead of requiring shopkeepers to pay for expensive enterprise WhatsApp Business APIs, BolKhata connects directly to their existing WhatsApp account via QR code scanning using a backend Baileys engine.

### 4. Multi-Tenant Cloud Sync with Offline Resilience
Merchants can use local storage immediately while enjoying automatic cloud backup and multi-device access through Supabase PostgreSQL and Row Level Security (RLS).

---

## 4. Platform Architecture

```text
                                  ┌──────────────────────────────┐
                                  │      Expo React Native       │
                                  │      (Android, iOS, Web)     │
                                  └──────────────┬───────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │ HTTPS REST & SSE Streams                        │ Supabase Auth & Direct Data
                        ▼                                                 ▼
        ┌──────────────────────────────┐                         ┌──────────────────┐
        │   Express 5 Node.js Server   │                         │     Supabase     │
        │  ├── Voice Service Pipeline  │                         │ ├── PostgreSQL   │
        │  │   ├── ElevenLabs / Groq   │                         │ ├── Auth Service │
        │  │   └── Gemini / Qwen / LLM │                         │ └── RLS Policies │
        │  └── Baileys WhatsApp Engine │                         └──────────────────┘
        │      ├── SSE QR Streamer     │
        │      └── Scheduler & History │
        └──────────────────────────────┘
```
