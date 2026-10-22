# BolKhata — Supabase Authentication Architecture & Implementation Guide

This document describes the production implementation of **Supabase Authentication** in **BolKhata**, covering both the Expo/React Native frontend client and the Express 5 backend API.

---

## 📌 Architecture Overview

Supabase Auth serves as the unified identity and access management layer across BolKhata:

```text
                  User Opens App
                        │
                  SplashScreen (Animated Letter Reveal)
                        │
             ┌──────────┴──────────┐
      Session Found?         No Session
             │                     │
      Load User Ledger       Intro Seen?
      (AsyncStorage +        ├── No  → IntroScreen (Carousel)
       Supabase Cloud)       └── Yes → WelcomeScreen
             │                             │
        HomeScreen                   AuthScreen (Login / Signup)
                                           │
                                    Supabase Auth API
                                           │
                                  Store Setup Wizard
                               (OnboardingWizardModal)
                                           │
                                   SetupCelebration
                                           │
                                      HomeScreen
```

---

## 🛠️ Key Components & Implementation

### 1. Supabase Client Configuration (`frontend/src/services/supabase.ts`)
The client is initialized using `@supabase/supabase-js` with `@react-native-async-storage/async-storage` as the persistence engine:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Consumes PKCE code automatically in browsers
  },
});
```

### 2. Deep Linking & PKCE Code Exchange (`frontend/App.tsx`)
Native mobile platforms authenticate via OAuth or confirmation emails using deep linking schemes (`bolkhata://` and `veldger://` declared in `app.json`):

- **Web Platform**: `detectSessionInUrl: true` handles PKCE parameters. `App.tsx` scrubs the URL (`window.history.replaceState`) after session establishment to prevent replaying spent single-use codes on refresh.
- **Native Platforms (Android/iOS)**: `Linking.addEventListener('url', handleDeepLink)` intercepts callback URLs:
  1. **PKCE Exchange**: Extracts `?code=` from query parameters and calls `supabase.auth.exchangeCodeForSession(code)`.
  2. **Implicit Token Hash**: Extracts `#access_token=...&refresh_token=...` from the URL fragment and calls `supabase.auth.setSession({ access_token, refresh_token })`.

### 3. User-Scoped Local Storage Isolation (`frontend/src/services/storage.ts`)
To prevent data contamination between different accounts on shared mobile devices:

```typescript
const userKey = (baseKey: string, userId?: string) =>
  userId ? `${baseKey}_${userId}` : baseKey;
```

All local keys for `STORE_PROFILE`, `PARTIES`, `TRANSACTIONS`, and `CASHBOOK` are dynamically scoped by the active `userId`. When a user logs out (`SIGNED_OUT` event):
- The in-memory state is wiped.
- The view resets to `WelcomeScreen`.
- Another user logging in reads only their own isolated keys.

### 4. Human-Friendly Error Translation (`frontend/src/services/authErrors.ts`)
Raw technical errors from Supabase are mapped to user-friendly messages:
- `Invalid login credentials` → *"Email ya password ghalat hai. Dobara koshish karein."* (Invalid email or password).
- `User already registered` → *"Yeh email pehle se registered hai. Log in karein."* (Email already registered).
- `Password should be at least 6 characters` → *"Password kam az kam 6 characters ka hona chahiye."* (Password must be 6+ chars).

### 5. Backend Bearer Token Verification (`backend/src/middleware/auth.middleware.ts`)
Protected Express endpoints (such as `POST /voice/process` and `POST /voice/tts`) validate incoming Bearer tokens using Supabase Admin:

```typescript
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Internal Server Error' });
  }
};
```

### 6. Voice Quota & Developer Bypass (`backend/src/middleware/voiceLimit.middleware.ts`)
- Standard authenticated users are granted a daily voice processing quota (default: 50 requests/day).
- Unlimited developer/admin bypass is granted if the user's email is in `DEVELOPER_EMAILS` (e.g. `talhairfan1947@gmail.com`), ends with `@bolkhata.com`, or has `is_developer: true` in user metadata.

---

## 🗄️ Multi-Tenant Database Schema (`backend/src/database/schema_v2.sql`)

PostgreSQL tables enforce user and store tenancy with foreign keys and Row Level Security (RLS):

- **`stores`**: `id UUID PRIMARY KEY`, `user_id UUID NOT NULL`, `name TEXT`, `owner_name TEXT`, `phone TEXT`, `currency TEXT`.
- **`customers`**: `id UUID PRIMARY KEY`, `store_id UUID REFERENCES stores(id)`, `user_id UUID NOT NULL`, `name TEXT`, `phone TEXT`, `balance NUMERIC`.
- **`transactions`**: `id UUID PRIMARY KEY`, `store_id UUID`, `customer_id UUID REFERENCES customers(id)`, `type TEXT ('gave' | 'got')`, `amount NUMERIC`.
- **`cashbook`**: `id UUID PRIMARY KEY`, `store_id UUID`, `user_id UUID`, `type TEXT ('in' | 'out')`, `amount NUMERIC`, `category TEXT`.

Indexes on `customers(user_id)`, `transactions(customer_id)`, `transactions(created_at DESC)`, and `cashbook(user_id)` provide sub-millisecond querying during real-time speech reconciliation.

---

## ✅ Verified Testing Checklist

- [x] Email + password user registration
- [x] Email + password user login
- [x] Session persistence across page reloads and native app restarts
- [x] PKCE code exchange and URL scrubbing on web
- [x] Deep link handling on Android and iOS (`bolkhata://`)
- [x] First-run intro slides display and one-time flag persistence
- [x] Post-login store setup wizard and celebratory animation
- [x] User-scoped local storage isolation
- [x] User logout and state cleanup
- [x] Backend Bearer token validation on `/voice/process`
- [x] Daily voice request quota and developer bypass execution
