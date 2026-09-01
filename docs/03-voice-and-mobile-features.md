# BolKhata Voice AI & Mobile Features

## 1. Multi-Tier Voice AI Engine

BolKhata features an intelligent voice pipeline designed specifically for South Asian colloquial speech (Urdu, Roman Urdu, Hindi, English).

```text
                               ┌────────────────────────────────┐
                               │   Shopkeeper Spoken Input      │
                               └────────────────┬───────────────┘
                                                │
                                                ▼
              ┌──────────────────────────────────────────────────────────────────┐
              │                   Speech-to-Text (STT) Cascade                   │
              │  1. ElevenLabs Scribe STT (`scribe_v1`) [Primary]                │
              │  2. Groq Whisper Large v3 Turbo (`whisper-large-v3-turbo`)       │
              │  3. Raw text string payload [Fallback]                           │
              └─────────────────────────────────┬────────────────────────────────┘
                                                │
                                                ▼
              ┌──────────────────────────────────────────────────────────────────┐
              │                   LLM Brain Multi-Model Cascade                  │
              │  1. Google Gemini Flash Lite (`gemini-flash-lite-latest`)        │
              │  2. Alibaba Cloud DashScope Qwen Turbo (`qwen-turbo`)            │
              │  3. Groq Llama 3.3 70B Versatile (`llama-3.3-70b-versatile`)     │
              └─────────────────────────────────┬────────────────────────────────┘
                                                │
                                                ▼
              ┌──────────────────────────────────────────────────────────────────┐
              │                Structured JSON & Intent Schema                   │
              │  - Intent: create/update/delete_transaction, get_balance         │
              │  - Direction: gave / got                                         │
              │  - Amount, Person, Reason, Date                                  │
              └─────────────────────────────────┬────────────────────────────────┘
                                                │
                                                ▼
              ┌──────────────────────────────────────────────────────────────────┐
              │          Levenshtein Distance Fuzzy Customer Matcher             │
              │  Matches spoken names against existing contacts with tolerance ≤2│
              └─────────────────────────────────┬────────────────────────────────┘
                                                │
                                                ▼
              ┌──────────────────────────────────────────────────────────────────┐
              │        Interactive Confirmation Sheet in Expo Client             │
              └──────────────────────────────────────────────────────────────────┘
```

---

## 2. LLM System Prompt Schema

```json
{
  "intent": "create_transaction" | "update_transaction" | "delete_transaction" | "delete_customer" | "get_balance",
  "person": {
    "name": "Person Name in English TitleCase"
  },
  "transaction": {
    "direction": "gave" | "got",
    "amount": 500,
    "reason": "cutting / saman / petrol / repair",
    "date": "YYYY-MM-DD"
  },
  "searchCriteria": {
    "previousAmount": null,
    "relativeTime": "last" | "today" | "yesterday" | null
  },
  "changes": {
    "amount": null,
    "direction": null,
    "reason": null
  }
}
```

### Conversions & Rules
- **Direction**:
  - `gave` = Money or goods given out / Udhaar diya / I paid them / They owe me.
  - `got` = Money received in / Udhaar liya / I owe them / Payment received.
- **Number Parsing**: *1 lakh* $\rightarrow$ 100,000; *5 hazar* $\rightarrow$ 5,000; *derh hazar* $\rightarrow$ 1,500; *dhai hazar* $\rightarrow$ 2,500.
- **Name Normalization**: Converts Urdu script names to Roman TitleCase (e.g. "عباس بھائی" $\rightarrow$ "Abbas Bhai", "اسامہ" $\rightarrow$ "Usama").

---

## 3. Baileys WhatsApp Automation Suite

BolKhata includes a native WhatsApp Web engine powered by `@whiskeysockets/baileys`:

```text
Expo Client (Settings / Customer Panel)
       │
       ├─ [GET /wa/link/:userId] (SSE Stream) ──> Baileys QR Code Generation
       ├─ [GET /wa/status/:userId] ──────────────> Connection Health Check
       ├─ [POST /wa/remind] ─────────────────────> Direct 1-Tap Text Message Dispatch
       └─ [POST /wa/schedule] ───────────────────> Background Scheduled Job Registration
```

### 1. Server-Sent Events (SSE) QR Pairing
Merchants open **Settings $\rightarrow$ Link WhatsApp** or click the WhatsApp icon. The backend opens an SSE channel, generates a live QR matrix, and streams base64 QR images to `WhatsAppLinkModal`. Once scanned, the state instantly shifts to `Connected`.

### 2. Live Reminder Templating
The app supports customizable templates with dynamic variables:
- `{customer_name}`: Customer's name
- `{amount}`: Outstanding balance (e.g. `2,500`)
- `{store_name}`: Merchant's store name

```text
Assalam-o-Alaikum {customer_name} bhai,
Aapka {store_name} par Rs. {amount} ka baki khata hai.
Jab aasani ho payment kar dein. Shukriya! 🙏
```

### 3. Background Reminder Scheduler
Merchants can schedule reminders for future dates/times (e.g. *"Remind next Monday at 10 AM"*). The backend scheduler tracks pending reminders and dispatches them automatically when due.

---

## 4. Mobile Client Screens & Modals

| Screen / Modal | Path | Description |
| :--- | :--- | :--- |
| `SplashScreen` | `src/components/SplashScreen.tsx` | Minimalist branded loading animation with letter-by-letter reveal |
| `IntroScreen` | `src/screens/IntroScreen.tsx` | 3-slide introductory pitch deck with skip / next pagination |
| `WelcomeScreen` | `src/screens/WelcomeScreen.tsx` | Clean landing view with Get Started / Sign In buttons |
| `AuthScreen` | `src/screens/AuthScreen.tsx` | Supabase Email/Password and Google OAuth authentication |
| `OnboardingWizardModal` | `src/screens/OnboardingWizardModal.tsx` | 5-step shopkeeper profile setup wizard |
| `SetupCelebration` | `src/components/SetupCelebration.tsx` | Animated confetti and checkmark handoff beat |
| `HomeScreen` | `src/screens/HomeScreen.tsx` | Balance overview, Quick Actions (Gave/Got/Voice), Recent Activity |
| `CustomersScreen` | `src/screens/CustomersScreen.tsx` | Grahak directory with search, filter tabs, and balance badges |
| `CustomerLedgerPanel` | `src/components/CustomerLedgerPanel.tsx` | Transaction timeline, WhatsApp reminder trigger, and full settlement |
| `CashbookScreen` | `src/screens/CashbookScreen.tsx` | Daily rokar entry (Cash In / Cash Out) and balance in hand |
| `ReportsScreen` | `src/screens/ReportsScreen.tsx` | Financial statements, date range filtering, and PDF export preview |
| `SettingsScreen` | `src/screens/SettingsScreen.tsx` | Profile management, currency, language, WhatsApp pairing & API connector |
| `VoiceAssistantModal` | `src/components/VoiceAssistantModal.tsx` | Voice recording orb, waveform visualizer, AI parser, confirmation card |
| `WhatsAppLinkModal` | `src/components/WhatsAppLinkModal.tsx` | Live SSE QR code pairing dialog |
| `WaTemplateModal` | `src/components/WaTemplateModal.tsx` | Template selector & custom editor with live preview |
| `WaScheduleModal` | `src/components/WaScheduleModal.tsx` | Date & time picker for scheduling future reminders |
