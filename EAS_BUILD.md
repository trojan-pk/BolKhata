# BolKhata — EAS Android Build & Distribution Guide

This document provides complete instructions for building, signing, and distributing standalone Android APK binaries for **BolKhata** using **EAS (Expo Application Services) Build**.

---

## 📱 Project Identification & Metadata

As configured in `frontend/app.json`:

| Attribute | Configuration Value |
| :--- | :--- |
| **App Name** | `BolKhata` |
| **App Slug** | `bolkhata` |
| **Android Package** | `com.bolkhata.app` |
| **App Version** | `1.1.0` |
| **Version Code** | `2` |
| **Deep Link Schemes** | `bolkhata`, `veldger` |
| **Expo Account Owner** | `ahmmikun` |
| **EAS Project ID** | `bf3933c2-90e7-4475-916d-388c547ee427` |
| **Required Permissions** | `android.permission.RECORD_AUDIO`, `android.permission.MODIFY_AUDIO_SETTINGS` |

---

## ⚙️ EAS Build Configuration (`frontend/eas.json`)

The EAS build profiles are defined in `frontend/eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "node": "22.14.0",
      "android": {
        "image": "latest"
      }
    },
    "preview": {
      "distribution": "internal",
      "node": "22.14.0",
      "android": {
        "buildType": "apk",
        "image": "latest"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bolkhata-api-241d1d60fc07.herokuapp.com",
        "EXPO_PUBLIC_SUPABASE_URL": "https://fdociazyyufqdfraacjc.supabase.co",
        "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_eK5e2rntPyXA0KZQ_8Zfwg__gkd-iB3",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    },
    "production": {
      "distribution": "internal",
      "node": "22.14.0",
      "android": {
        "buildType": "apk",
        "image": "latest"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://bolkhata-api-241d1d60fc07.herokuapp.com",
        "EXPO_PUBLIC_SUPABASE_URL": "https://fdociazyyufqdfraacjc.supabase.co",
        "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_eK5e2rntPyXA0KZQ_8Zfwg__gkd-iB3",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Key Profile Parameters
1. **`node: "22.14.0"`**: Matches our backend and frontend Node.js 22 LTS environment.
2. **`android.image: "latest"`**: Placed inside the `android` block to ensure EAS cloud runners use Android Build Image Ubuntu 22.04 with Java 17, which is required by Expo SDK 54 / React Native 0.81.
3. **`android.buildType: "apk"`**: Direct APK output (instead of `.aab` Android App Bundle), enabling instant sideloading and testing on Android physical devices.
4. **Environment Variables**: Inlined production endpoints for the Heroku Express API and Supabase project.

---

## 🚫 EAS Ignore Rules (`.easignore`)

To keep build payloads fast and prevent lockfile and native build conflicts:

### `frontend/.easignore`
```gitignore
# Native folders (EAS will run clean prebuild based on app.json)
android/
ios/

# Cache and build outputs
node_modules/
.expo/
dist/
web-build/
*.log
bun.lock
bun.lockb
```

### Root `.easignore`
```gitignore
# Exclude non-frontend packages from EAS cloud upload
backend/
docs/
node_modules/
.git/
.expo/
*.log
bun.lock
bun.lockb
frontend/bun.lock
frontend/bun.lockb
frontend/android/
frontend/ios/
frontend/dist/
frontend/web-build/
```

> **Crucial Rule**: EAS must always use `npm package-lock.json`. Any `bun.lock` files are excluded by `.easignore` to prevent build agent package manager confusion. Native `android/` directories are ignored to ensure EAS executes a clean `npx expo prebuild` dynamically.

---

## 🚀 How to Build the APK

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Authenticate with Expo
```bash
eas login
```
Ensure you are logged in as or invited to the `ahmmikun` Expo account that owns project ID `bf3933c2-90e7-4475-916d-388c547ee427`.

### 3. Verify Project Linkage
```bash
cd frontend
eas project:info
```

### 4. Trigger the Preview APK Build
Run the npm script configured in `frontend/package.json`:
```bash
npm run build:apk
```

Or trigger the EAS CLI directly:
```bash
eas build -p android --profile preview
```

### 5. Download and Install
Once the build completes on EAS cloud:
- EAS outputs a build URL (e.g. `https://expo.dev/accounts/ahmmikun/projects/bolkhata/builds/<build-id>`).
- Scan the QR code with your Android phone's camera, or download the `.apk` file directly to your phone.
- Enable **Install Unknown Apps** for your browser / file manager on Android and install `BolKhata.apk`.

---

## 🛠️ Troubleshooting Common Build Issues

### 1. Java 17 Compatibility Error
- **Symptom**: `Unsupported class file major version 65` or Gradle build failure during `compileDebugJavaWithJavac`.
- **Solution**: Ensure `"image": "latest"` is defined inside the `"android"` block of your profile in `frontend/eas.json`.

### 2. Lockfile Conflict (Bun vs npm)
- **Symptom**: EAS attempts to use Bun or fails during dependency resolution.
- **Solution**: Check that `.easignore` contains `bun.lock` and `bun.lockb`. Run `npm install` inside `frontend/` so that `package-lock.json` is up to date.

### 3. Missing Audio Permissions
- **Symptom**: Microphone does not record when testing on a physical device.
- **Solution**: Verify that `frontend/app.json` contains:
  ```json
  "permissions": [
    "android.permission.RECORD_AUDIO",
    "android.permission.MODIFY_AUDIO_SETTINGS"
  ]
  ```
  EAS prebuild will automatically inject these into the generated `AndroidManifest.xml`.

### 4. TypeScript Extends Configuration
- **Symptom**: EAS build fails during `expo export` with `@types/node` or tsconfig errors.
- **Solution**: `frontend/tsconfig.json` extends `"expo/tsconfig.base"` and includes `"node"` types:
  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      "types": ["node"]
    }
  }
  ```
