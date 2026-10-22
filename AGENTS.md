# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v58.0.0/ before writing any code.

## Repository Pinning & Architecture Notes
- **Installed SDK**: The active frontend codebase is pinned to Expo SDK `~58.0.0`, React `19.3.0`, and React Native `0.88.0` for build stability and EAS Android managed prebuild compatibility. Do not change SDK versions without testing native module builds.
- **Authentication**: Powered by Supabase Auth (PKCE deep linking `bolkhata://` and Bearer JWTs). All legacy Clerk references have been removed.
- **Voice UX**: Driven from the elevated central microphone button in the floating bottom [TabBar.tsx](file:///d:/My-Github-Projects/BolKhata/frontend/src/components/TabBar.tsx), opening [VoiceRecordingHUD.tsx](file:///d:/My-Github-Projects/BolKhata/frontend/src/components/VoiceRecordingHUD.tsx).
- **Backend**: Express 5.2.1 running on Node 22 with Supabase PostgreSQL (`schema_v2.sql`), Baileys v7 WhatsApp engine, and multi-tier AI (Groq Whisper / ElevenLabs Scribe STT, Gemini / Qwen / Llama 3.3 LLM, DashScope TTS).
- **Builds**: EAS Build produces standalone Android APKs (`com.bolkhata.app`, v1.1.0) using Java 17 and Node 22.14.0. Local `android/` directory is ignored via `.easignore` for clean managed prebuilds.
