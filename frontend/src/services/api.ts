import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Party, Transaction, CashbookEntry, StoreProfile, VoiceCommandParseResult } from '../types';

// Dynamically resolve API URL for Web, LAN IP, and Mobile Expo Go
export const getApiBaseUrl = () => {
  // 1. Check explicit remote API URL (if set and not localhost)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 2. Web browser: use window.location.hostname
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:3000`;
  }

  // 3. Mobile Device (Expo Go): automatically extract host machine's Wi-Fi IP from Metro
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

export const ApiService = {
  getStoreProfile: async (): Promise<StoreProfile> => {
    return {
      name: 'Bismillah General Store',
      ownerName: 'Muhammad Salman',
      mobile: '+92 300 1234567',
      currency: 'Rs',
      language: 'en',
      expressApiUrl: getApiBaseUrl(),
      isBackendConnected: true,
    };
  },

  saveStoreProfile: async (updated: StoreProfile): Promise<void> => {},

  getParties: async (): Promise<Party[]> => [],

  createParty: async (party: { name: string; mobile: string }): Promise<Party | null> => null,

  getTransactions: async (): Promise<Transaction[]> => [],

  createTransaction: async (data: { partyId: string; type: string; amount: number; description: string }) => null,

  processVoice: async (data: FormData | { text: string }): Promise<VoiceCommandParseResult> => {
    const targetUrl = `${getApiBaseUrl()}/voice/process`;
    console.log('[ApiService] Sending voice request to:', targetUrl);
    
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    
    if (isFormData) {
      // Native fetch for bulletproof FormData multipart upload
      const response = await fetch(targetUrl, {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error('[ApiService] Voice server error:', response.status, errText);
        throw new Error(`Server Error (${response.status}): ${errText}`);
      }
      
      const resJson = await response.json();
      console.log('[ApiService] Voice result:', resJson);
      return resJson;
    } else {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server Error (${response.status}): ${errText}`);
      }
      
      return await response.json();
    }
  },
  
  saveParties: async (newParties: Party[]) => {},
  saveTransactions: async (newTxns: Transaction[]) => {},
  getCashbook: async (): Promise<CashbookEntry[]> => [],
  saveCashbook: async (entries: CashbookEntry[]) => {},
};
