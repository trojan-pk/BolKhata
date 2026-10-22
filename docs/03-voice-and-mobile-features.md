# BolKhata Voice Assistant & Mobile Feature Architecture

## 1. Floating Voice Action Dock & HUD

The voice experience is the core differentiator of BolKhata. Unlike traditional apps that hide voice behind nested menus or secondary buttons, BolKhata places the voice assistant directly in the center of the persistent bottom navigation dock (`frontend/src/components/TabBar.tsx`).

```text
┌────────────────────────────────────────────────────────┐
│ [Home]     [Customers]      ( 🎙️ )      [Cashbook]  [Reports] │
└────────────────────────────────────────────────────────┘
```

### 1. Central Floating Microphone Button
- **Placement**: Fixed center action column in the floating `TabBar`.
- **Interaction Modes**:
  1. **Tap-to-Record**: Tap once to begin recording; tap the stop square icon to finish.
  2. **Hold-and-Release**: Press and hold to speak; release finger to automatically finalize and submit the recording.
- **Visual Feedback**: Real-time radiating pulse animation and icon state transitions (`Mic` ↔ `Square` stop icon).

### 2. Voice Recording HUD (`VoiceRecordingHUD.tsx`)
When recording starts, an elevated floating HUD overlay animates above the dock:
- **Timer Display**: Real-time elapsed recording timer in seconds (e.g. `0:04`).
- **Waveform & Pulse Indicator**: Animated pulsating audio circle reflecting active mic capture.
- **Dynamic Prompt Suggestions**: Rotating carousel of Roman Urdu prompt examples (e.g., *"Ahmed ne 500 ka saman udhaar liya"*, *"Ali ko 2000 diye"*, *"Bilal ka balance batao"*).
- **Controls**: Check button to complete recording; X button to abort/cancel without submitting.

### 3. Voice Recording Hook (`useVoiceRecording.ts`)
Manages audio permissions, cross-platform audio recording (`expo-audio`), file serialization, and dispatch to the Express backend API.

---

## 2. Voice Intent Recognition & Processing Pipeline

When audio is submitted to `POST /voice/process`:

```text
Audio File (m4a / webm)
       ↓
STT: Groq Whisper large-v3 / ElevenLabs
       ↓
Natural Language Urdu/Hindi Transcript
       ↓
LLM Extraction: Groq Llama 3 / Gemini / Qwen (JSON Schema)
       ↓
Levenshtein Customer Match against Local Ledger
       ↓
Spoken TTS Audio Generated (DashScope / ElevenLabs)
       ↓
Returned to Mobile Client
```

### Supported Financial Intents

| Intent | Description | Sample Spoken Phrase | Extracted Payload |
| :--- | :--- | :--- | :--- |
| `create_transaction` | Record new credit (Gave) or payment (Got) | *"Ahmed ne 500 ka saman udhaar liya"* | `{ direction: "gave", amount: 500, person: "Ahmed", reason: "saman" }` |
| `create_transaction` | Record payment received | *"Usama ne 1200 rupay jama karwaye"* | `{ direction: "got", amount: 1200, person: "Usama", reason: "jama" }` |
| `update_transaction` | Modify previous entry | *"Zain ki pichli entry 2000 kardo"* | `{ intent: "update_transaction", person: "Zain", changes: { amount: 2000 } }` |
| `delete_transaction` | Delete a recorded entry | *"Ali ka aakhri hisaab delete kardo"* | `{ intent: "delete_transaction", person: "Ali", searchCriteria: { relativeTime: "last" } }` |
| `delete_customer` | Remove customer profile | *"Babar ko delete kardo"* | `{ intent: "delete_customer", person: "Babar" }` |
| `get_balance` | Query outstanding balance | *"Farhan ka balance batao"* | `{ intent: "get_balance", person: "Farhan" }` |

### Natural Language Conversions
- **South Asian Number Formats**: Automatically converts spoken colloquial numbers:
  - *1 lakh* → `100000`
  - *5 hazar* → `5000`
  - *derh hazar* → `1500`
  - *dhai hazar* → `2500`
- **Urdu Script to Roman TitleCase**: Automatically transliterates script names (e.g. "عباس بھائی" → "Abbas Bhai", "اسامہ" → "Usama").
- **Automatic Phone Extraction**: If a mobile number is spoken during a new customer's entry, the system automatically sets the customer's phone number.

### Fuzzy Customer Matching (Levenshtein Distance)
The backend compares the spoken party name against the store's existing customer directory using Levenshtein edit distance:
- Matches variations such as "Usama" and "Osama", or "Abbas Bhai" and "Abbas".
- If a match is found with distance $\le 2$, the existing party ID is reused.
- If no match is found, a new customer record is automatically provisioned.

---

## 3. Voice Confirmation & Review (`VoiceAssistantModal.tsx`)

Before any financial entry is committed to the digital ledger, the user is presented with a clear verification card:

1. **Spoken Audio Confirmation**: Plays the generated TTS audio (e.g. *"Theek hai, Ahmed ko 500 rupay udhaar likh diye gaye hain."*).
2. **Visual Data Card**: Displays the party name, amount in bold typography, transaction direction tag (`Gave / Udhaar` in red, `Got / Jama` in green), note, and date.
3. **Editable Fields**: The shopkeeper can adjust the amount, party name, or notes directly if desired.
4. **Action Buttons**: Tapping **Confirm Entry** immediately commits the transaction with immutable running balance recalculation.

---

## 4. Native WhatsApp Integration

BolKhata includes a built-in WhatsApp Web engine powered by **Baileys v7** running on the Express backend:

### 1. Pairing via SSE QR Stream (`WhatsAppLinkModal.tsx`)
- The shopkeeper opens the WhatsApp settings in the app.
- A Server-Sent Events (SSE) connection opens to `GET /wa/link/:userId`.
- The backend emits QR code images as data events in real time.
- The shopkeeper scans the QR code in WhatsApp (Linked Devices). Once connected, the backend confirms session pairing.

### 2. Polite Reminder Templates (`WaTemplateModal.tsx`)
Predesigned, respectful reminder templates in Roman Urdu and English:
- **Casual / Gentle**: *"Salam {name} bhai, aap ke {storeName} par Rs. {balance} baqi hain. Fursat mein hisaab clear kar dijiyega. Shukriya!"*
- **Formal**: *"Moazziz Grahak {name}, aap ke {storeName} ke hisaab mein Rs. {balance} qabil-e-ada hain. Baraye meherbani adaigi farmaein."*
- **Urgent / Overdue**: Respectful but clear reminder for long-pending balances.

### 3. Markdown Formatting Preview (`WaMarkdownPreview.tsx`)
Renders WhatsApp formatting tokens (`*bold*`, `_italics_`, `~strike~`, ```code```) in real-time so the shopkeeper sees exactly what the customer will receive.

### 4. Scheduled Reminders (`WaScheduleModal.tsx`)
Allows shopkeepers to schedule payment reminders for a future date and time (e.g., at month-end or pay day). The backend scheduler automatically dispatches the message when due.
