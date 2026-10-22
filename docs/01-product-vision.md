# BolKhata Product Vision & Specification

## 1. Project Overview

- **Project**: BolKhata (بول کھاتا / बोल खाता)  
- **Team**: Trojan  
- **Hackathon**: Alibaba Cloud AI Hackathon Pakistan 2026, hosted through Alkhidmat Foundation Pakistan / Bano Qabil ecosystem.

### Hackathon Mission
Our AI-powered voice assistant helps small shopkeepers manage credit (*udhaar*) effortlessly. They simply speak to record customer purchases in their everyday language (Urdu, Roman Urdu, Hindi, or English), and the app automatically transcribes the audio, parses the intent, speaks back a confirmation, and maintains a multi-tenant digital ledger. Furthermore, BolKhata connects to WhatsApp to send polite voice and text reminders for overdue balances, eliminating awkward manual collection conversations and improving cash recovery.

### Core Product Flow

```text
Shopkeeper Speaks (Tap or Hold Mic on Dock)
      ↓
Audio Captured via expo-audio
      ↓
POST /voice/process (Bearer Auth + Rate Limit)
      ↓
Speech-to-Text (Groq Whisper large-v3 / ElevenLabs)
      ↓
LLM Intent Extraction (Groq Llama 3 / Gemini / Qwen)
      ↓
Levenshtein Fuzzy Customer Matching
      ↓
Text-to-Speech Confirmation (DashScope qwen3-tts-flash / ElevenLabs)
      ↓
VoiceAssistantModal: Spoken Confirmation + Visual Review
      ↓
Shopkeeper Confirms
      ↓
Immutable Ledger Update (Recalculated Running Balance)
      ↓
User-Scoped AsyncStorage + Supabase PostgreSQL Cloud Sync
      ↓
Polite WhatsApp Payment Reminder (Instant Send / Scheduled via Baileys v7)
```

BolKhata solves a ubiquitous South Asian small-business challenge: tedious manual paper register maintenance (*khatas*), unrecorded credit sales, and uncomfortable payment collection follow-ups.

---

## 2. Core User Experience & Demo Scenarios

### Scenario A: Recording Credit (Udhaar Diya / Gave)
- **Voice Input**: *"Ahmed ne 500 ka saman udhaar liya"*
- **Parsed Intent**: `create_transaction`
- **Fields**: Person: Ahmed | Direction: `gave` | Amount: Rs. 500 | Reason: "saman"
- **Spoken Confirmation**: *"Theek hai, Ahmed ko 500 rupay udhaar likh diye gaye hain."*
- **Action**: Ahmed's balance increases by Rs. 500 (Gave / Crimson Red).

### Scenario B: Recording Payment (Wapas Diye / Got)
- **Voice Input**: *"Ahmed ne 300 rupay wapas de diye"*
- **Parsed Intent**: `create_transaction`
- **Fields**: Person: Ahmed | Direction: `got` | Amount: Rs. 300 | Reason: "Payment received"
- **Spoken Confirmation**: *"Theek hai, Ahmed se 300 rupay wasool likh liye gaye hain."*
- **Action**: Ahmed's balance decreases by Rs. 300 (Got / Emerald Green).

### Scenario C: Balance Query (Hisaab Maloom Karna)
- **Voice Input**: *"Ahmed ka kitna hisaab baqi hai?"*
- **Parsed Intent**: `get_balance`
- **Action**: Assistant speaks current outstanding balance back to the shopkeeper without modifying the ledger.

### Scenario D: Updating or Deleting an Entry
- **Voice Input**: *"Ahmed ki pichli entry 2000 kardo"* or *"Ahmed ka aakhri hisaab delete kardo"*
- **Parsed Intent**: `update_transaction` or `delete_transaction`
- **Action**: Modifies previous entry or removes it, triggering an immutable recalculation of the customer's net balance.

### Scenario E: Polite WhatsApp Payment Follow-up
- Shopkeeper opens the customer's ledger panel.
- Taps **Remind via WhatsApp**.
- Selects a polite pre-written template (Roman Urdu/English) with automatic amount and store name placeholders.
- Can send immediately through the linked WhatsApp Web session or schedule it for a future date/time.

---

## 3. Core Architectural & Financial Principles

### 1. Deterministic Ledger Math
- **The LLM never directly touches the database.**
- The LLM's only role is converting unstructured speech into structured JSON:
  ```json
  {
    "intent": "create_transaction",
    "person": { "name": "Ahmed" },
    "transaction": { "direction": "gave", "amount": 500, "reason": "saman" }
  }
  ```
- All financial balances are computed deterministically by backend and frontend mathematical engines:
  $$\text{Current Balance} = \sum (\text{Gave Entries}) - \sum (\text{Got Entries})$$
- Opening balances are recorded as genuine transactions so that edits or deletions preserve historical accuracy.

### 2. Levenshtein Fuzzy Matching
Spoken names in Urdu/Hindi often vary in spelling (e.g. "Osama" vs "Usama", "Muhammad Ali" vs "Ali"). BolKhata runs a Levenshtein distance comparison against the store's existing customer directory to prevent duplicate customer profiles.

### 3. Graceful Error Handling & Clarification
If the spoken input lacks a clear monetary amount or person name, the voice engine returns a polite Roman Urdu clarification prompt rather than fabricating financial records.

---

## 4. Target Personas & Accessibility

1. **Kirana / Grocery Store Owners**: Fast-paced transactions during morning and evening rush hours where typing on a screen is too slow.
2. **Hardware & Repair Shops**: Often have dusty or grease-stained hands that make touching a phone screen inconvenient; 1-tap/hold voice entry solves this friction.
3. **Wholesale & Supply Distributors**: Require separate customer vs supplier designations with clear running statements and PDF exports.
