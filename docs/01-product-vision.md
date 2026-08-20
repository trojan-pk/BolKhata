# BolKhata Product Vision

## 1. Project Overview

Project: BolKhata  
Team: Trojan  
Hackathon: Alibaba Cloud AI Hackathon Pakistan 2026, hosted through Alkhidmat Foundation Pakistan / Bano Qabil ecosystem.

### Original idea submitted to the hackathon

Our AI-powered voice assistant helps small shopkeepers manage credit (udhaar) effortlessly. They simply speak to record customer purchases, and the app automatically creates a digital ledger. It also sends polite WhatsApp voice reminders for overdue payments, reducing manual work and improving timely collections without awkward conversations.

### Core product idea

BolKhata is a voice-first digital Khata for small shopkeepers.

The central experience is:

```text
Shopkeeper speaks
      ↓
Speech-to-Text
      ↓
AI understands intent + transaction
      ↓
Structured transaction
      ↓
Shopkeeper confirms
      ↓
Digital Khata updated
      ↓
Due payment tracking
      ↓
WhatsApp reminder
```

The product should solve a familiar Pakistani small-business problem: manually maintaining udhaar records and awkwardly asking customers for overdue payments.

## 2. Core User Experience

The most important demo flow is:

```text
🎙️ "Ahmed ne 500 ka saman udhaar liya"
                    ↓
                  STT
                    ↓
             AI understands
                    ↓
       Ahmed — Rs. 500 — Udhaar
                    ↓
                Confirm
                    ↓
              Khata updated
                    ↓
          Payment becomes due
                    ↓
       WhatsApp voice reminder
```

The app should feel like an AI voice assistant rather than a normal CRUD ledger.

A second useful voice interaction:

```text
"Ahmed ka kitna udhaar hai?"
```

AI should understand this as a balance query and return the customer's current outstanding balance.

Another:

```text
"Ahmed ne 500 rupay wapas de diye."
```

Should become:

```json
{
  "intent": "ADD_PAYMENT",
  "customerName": "Ahmed",
  "amount": 500
}
```

## 3. Important Product Principle

The LLM should not directly control the database.

Correct architecture:

```text
Voice
 ↓
STT
 ↓
LLM
 ↓
Structured JSON / intent
 ↓
Backend validation
 ↓
Business logic
 ↓
Database
```

Not:

```text
Voice
 ↓
LLM
 ↓
Direct database mutation
```

Financial calculations must be performed by deterministic backend code.

Example:

Credit = customer owes shopkeeper  
Payment = customer paid shopkeeper

```text
Balance = total credit - total payments
```

Example:

```text
Ahmed buys Rs. 500
Ahmed buys Rs. 300
Ahmed pays Rs. 400

Balance = 500 + 300 - 400
        = Rs. 400
```

The AI should extract data; the backend should calculate authoritative balances.

If an amount is unclear, the assistant should ask for confirmation instead of guessing.

Example:

```text
"Amount clear nahi hai. Kya aap 500 rupees keh rahe thay?"
```

## 4. Time Constraint

The hackathon submission/prototype has approximately 8 days.

The team has access to Qoder / agentic coding IDE credits and intends to use AI-assisted / vibe coding heavily.

Therefore:

- Avoid unnecessary complexity.
- Avoid multiple backend services unless genuinely required.
- Prefer reliable, fast-to-build technologies.
- Use AI agents for boilerplate and iteration.
- Manually verify critical financial, security, audio, and API logic.
- Focus on a polished core demo instead of many unfinished features.

## 5. Mobile vs Web Decision

We discussed whether to build:

- Mobile app
- Website
- Both

### Final recommendation for an 8-day hackathon: Primary product: Mobile app

Reason:

- Target users are small shopkeepers.
- Shopkeepers naturally use phones.
- Voice interaction is more natural on mobile.
- Microphone access and quick voice entry are central.
- A mobile-first product makes the value proposition immediately understandable.

Do not build two complete independent products in 8 days.

If the main mobile app becomes stable early, a small web/admin dashboard can optionally be added, but it should not delay the mobile MVP.

### Ideal optional architecture

```text
              Backend API
                  │
          ┌───────┴───────┐
          ↓               ↓
    Flutter/Expo App   Small Web Dashboard
      Shopkeeper          Admin/Judge
```

## 6. Flutter vs Expo Discussion

Flutter was initially strongly considered because:

- Flutter has a mature UI framework.
- There are many pre-built components/packages.
- It is mobile-first.
- It can be efficient for a polished hackathon app.
- The team has access to AI coding agents, reducing the problem of learning Flutter from scratch.

However, we later explored an Expo / React Native implementation workflow.

Important context:

- The user already has JavaScript/React/Node knowledge.
- Expo can reduce the learning curve.
- Qoder can generate a lot of mobile boilerplate.
- Both Flutter and Expo can work with the same backend architecture.

For the workflow documented in this chat, the selected example stack is Expo + React Native + TypeScript.

If the team ultimately chooses Flutter, the backend architecture remains almost identical.

## Chosen Platform Direction

BolKhata will use Supabase for the managed backend foundation:

- Supabase PostgreSQL for relational data and financial transactions
- Supabase Auth for shopkeeper authentication
- Supabase Row Level Security for tenant-level data protection
- Supabase Storage when audio or other files need to be persisted

The Express API remains the controlled business-logic layer for voice processing, validation, transaction confirmation, and WhatsApp integrations. The mobile app must not call AI providers directly.
