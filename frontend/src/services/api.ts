import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Party, Transaction, CashbookEntry, StoreProfile, VoiceCommandParseResult } from '../types';
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
  } catch (err) {
    // fallback
  }

  return 'http://localhost:3000';
};

// Helper to retrieve active Supabase Authorization Bearer header
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (e) {
    // Non-blocking
  }
  return {};
}

export const ApiService = {
  getStoreProfile: async (): Promise<StoreProfile> => {
    return {
      name: 'My Store',
      ownerName: 'Shopkeeper',
      mobile: '',
      currency: 'Rs',
      language: 'roman_ur',
      expressApiUrl: getApiBaseUrl(),
      isBackendConnected: true,
    };
  },

  saveStoreProfile: async (updated: StoreProfile): Promise<void> => {},

  getParties: async (): Promise<Party[]> => [],
  createParty: async (party: { name: string; mobile: string }): Promise<Party | null> => null,
  getTransactions: async (): Promise<Transaction[]> => [],
  createTransaction: async (data: { partyId: string; type: string; amount: number; description: string }) => null,

  processVoice: async (
    data: FormData | { text: string; people?: { id: string; name: string }[]; current_date?: string }
  ): Promise<VoiceCommandParseResult> => {
    const targetUrl = `${getApiBaseUrl()}/voice/process`;
    const authHeaders = await getAuthHeaders();
    
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    
    if (isFormData) {
      const response = await fetch(targetUrl, {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
          ...authHeaders,
        },
      });
      
      if (!response.ok) {
        let errMessage = `Server Error (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.error) errMessage = errJson.error;
        } catch (e) {
          errMessage = await response.text();
        }
        throw new Error(errMessage);
      }
      
      const resJson = await response.json();
      const { audioBase64, ...cleanLog } = resJson;
      console.log('[ApiService] Voice result:', cleanLog);
      return resJson;
    } else {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        let errMessage = `Server Error (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson?.error) errMessage = errJson.error;
        } catch (e) {
          errMessage = await response.text();
        }
        throw new Error(errMessage);
      }
      
      const resJson = await response.json();
      const { audioBase64, ...cleanLog } = resJson;
      console.log('[ApiService] Voice result:', cleanLog);
      return resJson;
    }
  },

  generateSpeech: async (text: string, voiceId?: string): Promise<{ audioBase64: string } | null> => {
    try {
      const targetUrl = `${getApiBaseUrl()}/voice/tts`;
      const authHeaders = await getAuthHeaders();
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ text, voiceId }),
      });
      if (response.ok) {
        return response.json();
      }
    } catch (e) {
      console.warn('[ApiService] TTS generation error:', e);
    }
    return null;
  },
  
  saveParties: async (newParties: Party[]) => {},
  saveTransactions: async (newTxns: Transaction[]) => {},
  getCashbook: async (): Promise<CashbookEntry[]> => [],
  saveCashbook: async (entries: CashbookEntry[]) => {},

  // ── WhatsApp integration ──────────────────────────────────────────────────

  checkWaStatus: async (userId: string): Promise<{ linked: boolean; phone?: string }> => {
    const res = await fetch(`${getApiBaseUrl()}/wa/status/${userId}`);
    if (!res.ok) return { linked: false };
    return res.json();
  },

  sendWaReminder: async (
    userId: string,
    customer: { id: string; name: string; phone: string; balance: number; message?: string; storeName?: string }
  ): Promise<{ success: boolean; sentAt?: string; error?: string }> => {
    const res = await fetch(`${getApiBaseUrl()}/wa/remind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        customerId: customer.id,
        phone: customer.phone,
        name: customer.name,
        balance: customer.balance,
        message: customer.message,
        storeName: customer.storeName,
      }),
    });
    return res.json();
  },

  unlinkWa: async (userId: string): Promise<void> => {
    await fetch(`${getApiBaseUrl()}/wa/link/${userId}`, { method: 'DELETE' });
  },

  scheduleWaReminder: async (
    userId: string,
    payload: {
      customerId: string;
      name: string;
      phone: string;
      balance: number;
      scheduledAt: string;
      message?: string;
      storeName?: string;
    }
  ): Promise<{ success: boolean; schedule?: any; error?: string }> => {
    const res = await fetch(`${getApiBaseUrl()}/wa/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...payload }),
    });
    return res.json();
  },

  getScheduledWaReminders: async (userId: string): Promise<any[]> => {
    const res = await fetch(`${getApiBaseUrl()}/wa/schedule/${userId}`);
    if (!res.ok) return [];
    return res.json();
  },

  cancelScheduledWaReminder: async (userId: string, scheduleId: string): Promise<void> => {
    await fetch(`${getApiBaseUrl()}/wa/schedule/${userId}/${scheduleId}`, {
      method: 'DELETE',
    });
  },
};
