# Railway Deployment Guide for BolKhata Backend

This guide walks you through deploying the **BolKhata Express + TypeScript Backend** to [Railway](https://railway.com/).

---

## 🚀 Quick Setup Steps

### Option A: Deploy via GitHub (Recommended)

1. **Push Changes to GitHub**:
   Ensure all changes in `backend/` (`Dockerfile`, `railway.json`, `Procfile`, etc.) are committed and pushed to your GitHub repository.

2. **Create New Project in Railway**:
   - Go to [railway.com/dashboard](https://railway.com/dashboard).
   - Click **+ New Project** -> **Deploy from GitHub repo**.
   - Select your `BolKhata` repository.

3. **Configure Service Settings**:
   - Click on your newly created service.
   - Go to the **Settings** tab.
   - Set **Root Directory** to `/backend` (or `backend`).
   - Under **Build**, Railway will automatically detect `railway.json` and use the multi-stage `Dockerfile`.

4. **Set Environment Variables**:
   - Go to the **Variables** tab of the service.
   - Add the following environment variables:

| Variable | Description | Example / Required |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Listening Port | `3000` (or Railway auto-injected `$PORT`) |
| `SUPABASE_URL` | Supabase Project URL | `https://xxxx.supabase.co` (**Required**) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `ey...` (**Required**) |
| `JWT_SECRET` | Secret for signing JWTs | Random 32+ character string (**Required**) |
| `GEMINI_API_KEY` | Google Gemini AI Key | (**Optional / Voice AI**) |
| `GROQ_API_KEY` | Groq API Key | (**Optional / Voice Whisper**) |
| `DASHSCOPE_API_KEY` | DashScope API Key | (**Optional**) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API Key | (**Optional / Voice Output**) |

5. **Generate Public Domain**:
   - In your Service -> **Settings** -> **Networking**.
   - Click **Generate Domain** (e.g. `bolkhata-backend-production.up.railway.app`).

6. **Verify Deployment**:
   - Open your browser or run:
     ```bash
     curl https://bolkhata-production-6447.up.railway.app/health
     ```
   - Expected response:
     ```json
     { "status": "ok", "app": "BolKhata API", "uptime": ..., "timestamp": "..." }
     ```

---

### Option B: Deploy via Railway CLI

If you prefer using the command line:

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login & Initialize**:
   ```bash
   railway login
   cd backend
   railway link
   ```

3. **Set Variables & Deploy**:
   ```bash
   railway up --service BolKhata
   ```

4. **Add Domain**:
   ```bash
   railway domain
   ```

---

## 📱 Updating the Frontend

After getting your Railway public URL (`https://bolkhata-production-6447.up.railway.app`), update your frontend configuration:

In `frontend/.env.local`:
```env
EXPO_PUBLIC_API_URL=https://bolkhata-production-6447.up.railway.app
```
