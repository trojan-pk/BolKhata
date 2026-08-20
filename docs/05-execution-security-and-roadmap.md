# BolKhata Execution, Security, and Roadmap

## 25. Qoder / Agentic IDE Strategy

The team has many Qoder credits.

Do not simply ask the agent:

```text
"Build the entire BolKhata app."
```

Instead work in phases:

1. Architecture
2. Backend foundation
3. Database schema
4. Authentication
5. Customer + transaction CRUD
6. Voice pipeline
7. LLM extraction
8. Flutter/Expo UI
9. API integration
10. WhatsApp
11. Testing
12. Polish + demo

After every phase:

```text
Implement
 ↓
Run
 ↓
Test
 ↓
Inspect errors
 ↓
Fix
 ↓
Review
 ↓
Commit
```

Do not let the AI generate thousands of unverified lines in one shot.

## 26. MCP / AI Tooling Discussion

The team discussed using MCPs and skills with Claude Code / agentic IDEs.

### Recommended focused tooling

#### High priority

- Flutter/Dart MCP if Flutter is selected
- GitHub MCP
- Filesystem/project tools
- Git tooling
- Documentation/context tool such as Context7
- Playwright if web/browser testing is needed
- Database MCP if useful and safely configured

#### Optional

- Figma MCP if UI is designed in Figma
- Vercel MCP if Vercel is used
- Sentry MCP for error monitoring
- Docker tooling if containers are used

#### Baileys MCP

- Baileys will be used by the backend for WhatsApp messaging and reminders.
- Use the [Baileys MCP](https://baileys.wiki/mcp) as a read-only documentation search and retrieval tool during development.
- The MCP helps the team and coding agents look up Baileys APIs and guides; it does not replace the backend Baileys service or send WhatsApp messages itself.

Do not install dozens of MCPs just because they exist.

More MCPs do not automatically make an agent better.

## 27. Suggested Custom AI Development Skills

Potential skills/rules:

- Flutter/Expo architecture
- Mobile UI/UX
- Voice UX
- Voice → transaction extraction
- Financial/Khata business logic
- WhatsApp reminders
- AI/API integration
- Security
- Testing
- Agentic development workflow

Important custom rule:

The LLM extracts intent and structured data. The backend validates it and performs all authoritative business/financial operations.

## 28. Security Rules

Never expose the following inside the mobile app:

- MongoDB/PostgreSQL credentials
- AI provider API keys
- WhatsApp secrets
- JWT signing secrets

Use environment variables on the backend:

```text
DATABASE_URL=
JWT_SECRET=
AI_API_KEY=
WHATSAPP_TOKEN=
```

Mobile only communicates with authenticated backend APIs.

Other important rules:

- Validate all user input.
- Validate all AI output.
- Never trust LLM-generated amounts blindly.
- Never let the LLM directly execute database mutations.
- Use authorization per shopkeeper/user.
- Avoid logging sensitive customer data.
- Use HTTPS.

## 29. Final Recommended Stack for Expo Version

### 📱 MOBILE

- Expo
- React Native
- TypeScript
- Expo Router

### 🎨 UI

- NativeWind / StyleSheet

### 🔄 STATE

- Zustand

### 🎙️ AUDIO

- Expo audio/recording

### 🔐 STORAGE

- Expo SecureStore

### 🔙 BACKEND

- Node.js
- TypeScript
- Express

### DATABASE

- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security
- Supabase Storage when needed

### AI

- STT: Groq + Whisper primary, Deepgram fallback, self-hosted Whisper emergency
- LLM: hosted provider behind the Express API
- TTS: Alibaba Qwen primary, Gemini and Deepgram Aura fallbacks, ElevenLabs optional, Qwen/CosyVoice emergency

### VOICE PROVIDER RULE

- Express owns the Voice Service and provider abstraction.
- The Expo app never calls Groq, Deepgram, Alibaba, Gemini, ElevenLabs, or local models directly.
- A failed provider automatically moves the request to the next configured provider.

### 💬 COMMUNICATION

- Baileys for backend WhatsApp messaging and reminders
- Baileys MCP for development-time documentation lookup: https://baileys.wiki/mcp

### 🔑 AUTH

- JWT

### 🧪 TESTING

- Vitest/Jest
- React Native Testing Library
- Expo integration testing
- API tests

### 🚀 DEPLOYMENT

- Railway / Render
- Supabase

### 🧑‍💻 DEVELOPMENT

- Git
- GitHub
- Qoder

### 🤖 AI DEVELOPMENT

- Qoder + focused MCPs/skills

## 30. Recommended 8-Day Priority

### DAY 1

Project setup  
Architecture  
Database  
Auth foundation

### DAY 2

Customers  
Transactions  
Khata

### DAY 3

Dashboard  
Mobile UI  
Navigation

### DAY 4

Voice recording  
STT integration

### DAY 5

LLM extraction  
Intent system  
Confirmation flow

### DAY 6

TTS  
WhatsApp reminders  
End-to-end voice flow

### DAY 7

Testing  
Bug fixing  
Real-device testing  
UI polish

### DAY 8

Demo preparation  
Presentation  
Demo script  
Final bug fixes

The most important objective is not to build every possible feature.

The target is a polished end-to-end demo:

```text
🎙️ Speak
 ↓
🧠 AI understands
 ↓
📒 Khata updates
 ↓
💰 Balance changes
 ↓
🔔 Due payment detected
 ↓
💬 WhatsApp voice reminder
```

That is the core BolKhata story and should remain the highest priority throughout the 8-day build.
