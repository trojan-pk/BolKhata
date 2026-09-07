import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://fdociazyyufqdfraacjc.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2NpYXp5eXVmcWRmcmFhY2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzQ4NzIsImV4cCI6MjEwMjkxMDg3Mn0.ZgO3ka_p82Xf5TRF00jYjMFxtu_ezxan2yvgUlWwTkE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    /**
     * On web, supabase-js is the *only* thing allowed to consume the `?code=`
     * in the address bar. App.tsx therefore skips its own deep-link exchange on
     * web — a PKCE code is single-use, and both consumers racing for it meant
     * whichever lost threw "invalid flow state" and the sign-in silently failed.
     *
     * On native there is no address bar to read, so the app handles the
     * `bolkhata://` callback itself and this stays off.
     */
    detectSessionInUrl: Platform.OS === 'web',
    /** Stated explicitly: the callback handling on both platforms assumes PKCE. */
    flowType: 'pkce',
  },
});
