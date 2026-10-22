# BolKhata Backend — Cloud Deployment Guide (Railway & Heroku)

This guide walks you through deploying the **BolKhata Express + TypeScript API Backend** to **Railway** and **Heroku**.

---

## 🚀 Option A: Deploy to Railway (Containerized)

Railway builds the backend using the multi-stage `Dockerfile` and `railway.json`.

### 1. Push Changes to GitHub
Ensure all changes in `backend/` are pushed to your GitHub repository.

### 2. Create Project in Railway
1. Open [railway.com/dashboard](https://railway.com/dashboard).
2. Click **+ New Project** -> **Deploy from GitHub repo**.
3. Select your `BolKhata` repository.

### 3. Configure Service Settings
1. Go to your service **Settings**.
2. Set **Root Directory** to `backend` (or `/backend`).
3. Railway will automatically detect `railway.json` and use `Dockerfile` (Node 22 Alpine multi-stage).

### 4. Configure Environment Variables
In the **Variables** tab, add:

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Listening port | Railway sets `$PORT` | `3000` |
| `SUPABASE_URL` | Supabase Project URL | **Yes** | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Admin / Service Role Key | **Yes** | `eyJhbGci...` |
| `GROQ_API_KEY` | Groq Whisper STT & Llama 3 parsing | **Yes** | `gsk_...` |
| `DASHSCOPE_API_KEY` | Alibaba DashScope Qwen3-TTS | Optional | `sk-...` |
| `GEMINI_API_KEY` | Google Gemini LLM fallback | Optional | `AIza...` |
| `ELEVENLABS_API_KEY` | ElevenLabs Scribe STT / Voice TTS | Optional | `...` |
| `DAILY_VOICE_LIMIT` | Max voice requests per user/day | Optional | `50` |
| `DEVELOPER_EMAILS` | Unlimited voice quota bypass emails | Optional | `talhairfan1947@gmail.com,admin@bolkhata.com` |

### 5. Generate Domain & Verify Health
1. Go to **Settings** -> **Networking** -> **Generate Domain**.
2. Example domain: `https://bolkhata-production-6447.up.railway.app`.
3. Verify:
   ```bash
   curl https://bolkhata-production-6447.up.railway.app/health
   # Response: {"status":"ok","app":"BolKhata API","uptime":...,"timestamp":"..."}
   ```

---

## 🟣 Option B: Deploy to Heroku

BolKhata is also configured for Heroku deployment using `Procfile` and Node 22 buildpacks.

### 1. Repository Configuration
- `backend/Procfile`:
  ```
  web: npm start
  ```
- `backend/package.json`:
  ```json
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "heroku-postbuild": "npm run build"
  },
  "engines": {
    "node": "22.x",
    "npm": "10.x"
  }
  ```
- `backend/.npmrc`:
  ```
  allow-git=true
  ```
  *(Required for Baileys libsignal git dependencies)*

### 2. Deploy via Heroku CLI
```bash
# 1. Login
heroku login

# 2. Add Heroku remote or create app
heroku create bolkhata-api

# 3. Set Config Vars
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=https://xxxx.supabase.co
heroku config:set SUPABASE_SERVICE_ROLE_KEY=ey...
heroku config:set GROQ_API_KEY=gsk_...
heroku config:set DASHSCOPE_API_KEY=sk-...

# 4. Deploy Backend Subtree
git subtree push --prefix backend heroku main
```

- Production Heroku Endpoint: `https://bolkhata-api-241d1d60fc07.herokuapp.com`

---

## 📱 Updating the Frontend

Once your backend is live, update the frontend API URL:

### In `frontend/.env.local`:
```env
EXPO_PUBLIC_API_URL=https://bolkhata-api-241d1d60fc07.herokuapp.com
```

### In `frontend/eas.json`:
Update the `preview` and `production` profile `EXPO_PUBLIC_API_URL` to match your deployed URL before triggering `npm run build:apk`.

---

## 💬 WhatsApp Session Storage Note

The backend WhatsApp engine (Baileys v7) saves session credentials inside the `backend/wa/<userId>/` directory.
- On platforms with ephemeral filesystems (like default Heroku dynos or unattached Railway containers), a container restart will require the shopkeeper to scan the QR code again in the app (`WhatsAppLinkModal.tsx`).
- For long-running production, attach a Railway persistent volume or persistent disk mounted at `/backend/wa`.
