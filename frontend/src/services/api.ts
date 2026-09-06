import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { VoiceCommandParseResult } from '../types';
import { supabase } from './supabase';

// Dynamically resolve API URL for Web, LAN IP, and Mobile Expo Go
export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:3000`;
  }

  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri;

    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp) {
        return `http://${hostIp}:3000`;
      }
    }
  } catch {
    // fallback
  }

  return 'http://localhost:3000';
};

/** Supabase Bearer header for the active session, when signed in. */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // Non-blocking
  }
  return {};
}

/** Extracts the server's `error` message from a failed JSON response. */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {
    // non-JSON body
  }
  return fallback;
}

/**
 * Authenticated JSON request helper. Throws an Error carrying the server's
 * message on any non-2xx response.
 */
async function authedJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(await getAuthHeaders()),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Server Error (${res.status})`));
  }
  return res.json() as Promise<T>;
}

/* -------------------------------------------------------------- contracts -- */

export interface WaStatus {
  linked: boolean;
  phone?: string;
}

export interface WaSchedule {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  phone: string;
  balance: number;
  scheduledAt: string;
  message?: string;
  storeName?: string;
  countryCode?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  attempts?: number;
}

export interface WaQrResponse {
  status: 'linked' | 'connecting' | 'idle';
  qr: string | null;
  phone?: string;
}

export interface WaLinkTicket {
  ticket: string;
  userId: string;
  expiresInMs: number;
}

export const ApiService = {
  /* ---------------------------------------------------------------- voice -- */

  processVoice: async (
    data:
      | FormData
      | {
          text?: string;
          audioBase64?: string;
          audioType?: string;
          people?: { id: string; name: string }[];
          current_date?: string;
        },
  ): Promise<VoiceCommandParseResult> => {
    const targetUrl = `${getApiBaseUrl()}/voice/process`;
    const authHeaders = await getAuthHeaders();

    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

    // ── Log the outgoing request ──
    const startTime = Date.now();
    console.log(`\n🎙️ [ApiService] ═══ Voice STT Request ═══`);
    console.log(`🎙️ [ApiService] URL: ${targetUrl}`);
    console.log(`🎙️ [ApiService] isFormData: ${isFormData}`);
    console.log(`🎙️ [ApiService] hasAuth: ${!!authHeaders.Authorization}`);

    if (isFormData) {
      const fd = data as FormData;
      // Try to log FormData entries — RN's polyfill uses getParts(), web uses forEach
      try {
        const entries: string[] = [];
        if (typeof (fd as any).getParts === 'function') {
          // React Native polyfill
          const parts = (fd as any).getParts();
          for (const part of parts) {
            if (part.uri) {
              entries.push(
                `${part.fieldName}: file(uri=${part.uri.slice(0, 60)}..., type=${part.type || '?'})`,
              );
            } else if (part.string !== undefined) {
              const s = part.string;
              entries.push(
                `${part.fieldName}: ${s.length > 80 ? s.slice(0, 80) + '...' : s}`,
              );
            } else {
              entries.push(`${part.fieldName}: [unknown part]`);
            }
          }
        } else if (typeof fd.forEach === 'function') {
          fd.forEach((value, key) => {
            if (value instanceof Blob) {
              entries.push(`${key}: Blob(${value.size} bytes, ${value.type})`);
            } else {
              const strVal = String(value);
              entries.push(
                `${key}: ${strVal.length > 80 ? strVal.slice(0, 80) + '...' : strVal}`,
              );
            }
          });
        }
        console.log(`🎙️ [ApiService] FormData fields:\n   ${entries.join('\n   ')}`);
      } catch {
        console.log(`🎙️ [ApiService] FormData (could not enumerate entries)`);
      }
    } else {
      const jsonPayload = data as Record<string, unknown>;
      if (jsonPayload.audioBase64) {
        const b64 = jsonPayload.audioBase64 as string;
        console.log(
          `🎙️ [ApiService] Audio payload: base64=${b64.length} chars (~${Math.round((b64.length * 3) / 4 / 1024)}KB), type=${jsonPayload.audioType || '?'}`,
        );
        console.log(
          `🎙️ [ApiService] Other fields: people=${JSON.stringify(jsonPayload.people || []).slice(0, 100)}, date=${jsonPayload.current_date || '?'}`,
        );
      } else {
        console.log(`🎙️ [ApiService] Text payload:`, JSON.stringify(data).slice(0, 200));
      }
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: isFormData ? (data as FormData) : JSON.stringify(data),
      headers: isFormData
        ? { Accept: 'application/json', ...authHeaders }
        : {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeaders,
          },
    });

    const elapsedMs = Date.now() - startTime;
    console.log(
      `🎙️ [ApiService] Response status: ${response.status} ${response.statusText} (${elapsedMs}ms)`,
    );

    if (!response.ok) {
      const errMsg = await readErrorMessage(
        response,
        `Server Error (${response.status})`,
      );
      console.error(`❌ [ApiService] STT FAILED: ${errMsg}`);
      throw new Error(errMsg);
    }

    const resJson = await response.json();
    const { audioBase64, ...cleanLog } = resJson;
    console.log(`✅ [ApiService] STT result (${elapsedMs}ms):`, cleanLog);
    if (resJson.timings) {
      console.log(
        `   ↳ timings: STT=${resJson.timings.sttMs}ms (${resJson.timings.sttProvider}) | LLM=${resJson.timings.llmMs}ms (${resJson.timings.brainModel}) | Total=${resJson.timings.totalMs}ms`,
      );
    }
    return resJson;
  },

  generateSpeech: async (
    text: string,
    voiceId?: string,
  ): Promise<{ audioBase64: string } | null> => {
    const startTime = Date.now();
    console.log(`\n🔊 [ApiService] ═══ TTS Request ═══`);
    console.log(
      `🔊 [ApiService] text: "${text?.slice(0, 80)}${(text?.length || 0) > 80 ? '...' : ''}" (${text?.length || 0} chars)`,
    );
    console.log(`🔊 [ApiService] voiceId: ${voiceId || 'default'}`);

    try {
      const result = await authedJson<{ audioBase64: string }>('/voice/tts', {
        method: 'POST',
        body: JSON.stringify({ text, voiceId }),
      });
      const elapsedMs = Date.now() - startTime;
      const audioLen = result?.audioBase64?.length || 0;
      console.log(`✅ [ApiService] TTS OK in ${elapsedMs}ms (${audioLen} base64 chars)`);
      return result;
    } catch (e: any) {
      const elapsedMs = Date.now() - startTime;
      console.warn(`⚠️ [ApiService] TTS FAILED after ${elapsedMs}ms: ${e?.message || e}`);
      return null;
    }
  },

  /* ------------------------------------------------------------- whatsapp -- */
  // Identity comes from the Supabase JWT — no userId is ever passed in a URL
  // or body, so one merchant can never act on another's WhatsApp session.

  checkWaStatus: (): Promise<WaStatus> => authedJson<WaStatus>('/wa/status'),

  /** Get the current pairing QR code or connection status. */
  getWaQr: (): Promise<WaQrResponse> => authedJson<WaQrResponse>('/wa/qr'),

  /** Restart the pairing session to generate a fresh QR code. */
  refreshWaQr: (): Promise<{ success: boolean; status: string }> =>
    authedJson<{ success: boolean; status: string }>('/wa/qr/refresh', {
      method: 'POST',
    }),

  /**
   * Single-use, 60s pairing ticket. `EventSource` cannot send Authorization
   * headers, so the stream is opened with `?ticket=…` instead.
   */
  createWaLinkTicket: (): Promise<WaLinkTicket> =>
    authedJson<WaLinkTicket>('/wa/link/ticket', { method: 'POST' }),

  /** Opens the SSE stream URL for a freshly-minted ticket. */
  waLinkStreamUrl: async (): Promise<string> => {
    const { ticket, userId } = await ApiService.createWaLinkTicket();
    return `${getApiBaseUrl()}/wa/link/${userId}?ticket=${encodeURIComponent(ticket)}`;
  },

  unlinkWa: (): Promise<void> => authedJson<void>('/wa/link', { method: 'DELETE' }),

  sendWaReminder: async (customer: {
    id?: string;
    phone?: string;
    name?: string;
    balance: number;
    message?: string;
    storeName?: string;
  }): Promise<{
    success: boolean;
    phone?: string;
    message?: string;
    sentAt?: string;
  }> => {
    // Omit empty phone — the validator rejects blank strings, and the server
    // falls back to the stored customer record when the field is absent.
    const body: Record<string, unknown> = {
      balance: customer.balance,
      message: customer.message,
      storeName: customer.storeName,
    };
    if (customer.id) body.customerId = customer.id;
    if (customer.phone && customer.phone.trim()) body.phone = customer.phone.trim();
    if (customer.name) body.name = customer.name;

    return authedJson('/wa/remind', { method: 'POST', body: JSON.stringify(body) });
  },

  scheduleWaReminder: async (payload: {
    customerId: string;
    name: string;
    phone: string;
    balance: number;
    scheduledAt: string;
    message?: string;
    storeName?: string;
  }): Promise<{ success: boolean; schedule?: WaSchedule; error?: string }> =>
    authedJson('/wa/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getScheduledWaReminders: (): Promise<WaSchedule[]> =>
    authedJson<WaSchedule[]>('/wa/schedule'),

  cancelScheduledWaReminder: (scheduleId: string): Promise<void> =>
    authedJson<void>(`/wa/schedule/${encodeURIComponent(scheduleId)}`, {
      method: 'DELETE',
    }),

  getWaChatHistory: (jid: string): Promise<unknown[]> =>
    authedJson<unknown[]>(`/wa/history/${encodeURIComponent(jid)}`),
};
