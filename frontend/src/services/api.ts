import axios from 'axios';
import { Platform } from 'react-native';
import { Party, Transaction, CashbookEntry, StoreProfile, VoiceCommandParseResult } from '../types';

// Dynamically resolve API URL for localhost, LAN IP (e.g. 192.168.x.x), or Expo config
const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:3000`;
  }
  return 'http://localhost:3000';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
});

export const ApiService = {
  getStoreProfile: async (): Promise<StoreProfile> => {
    return {
      name: 'Bismillah General Store',
      ownerName: 'Muhammad Salman',
      mobile: '+92 300 1234567',
      currency: 'Rs',
      language: 'ur',
      expressApiUrl: getApiBaseUrl(),
      isBackendConnected: true,
    };
  },

  saveStoreProfile: async (updated: StoreProfile): Promise<void> => {
    console.log('Store profile saved:', updated);
  },

  getParties: async (): Promise<Party[]> => {
    try {
      const response = await api.get('/customers');
      return response.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        mobile: c.phone || '',
        type: 'customer',
        currentBalance: Number(c.balance),
        lastUpdated: c.created_at,
        avatarColor: '#2563eb',
      }));
    } catch (e) {
      return [];
    }
  },

  createParty: async (party: { name: string; mobile: string }): Promise<Party | null> => {
    try {
      const response = await api.post('/customers', {
        name: party.name,
        phone: party.mobile
      });
      const c = response.data;
      return {
        id: c.id,
        name: c.name,
        mobile: c.phone || '',
        type: 'customer',
        currentBalance: Number(c.balance),
        lastUpdated: c.created_at,
        avatarColor: '#2563eb',
      };
    } catch (e) {
      return null;
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return [];
  },

  createTransaction: async (data: { partyId: string; type: string; amount: number; description: string }) => {
    try {
      const response = await api.post('/transactions', {
        customer_id: data.partyId,
        type: data.type === 'gave' ? 'CREDIT' : 'PAYMENT',
        amount: data.amount,
        description: data.description
      });
      return response.data;
    } catch (e) {
      return null;
    }
  },

  processVoice: async (data: FormData | { text: string }): Promise<VoiceCommandParseResult | null> => {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const response = await api.post('/voice/process', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (e: any) {
      console.warn('Voice API server response issue, using local fallback:', e?.message);
      return null;
    }
  },
  
  // Stubs for remaining
  saveParties: async (newParties: Party[]) => {},
  saveTransactions: async (newTxns: Transaction[]) => {},
  getCashbook: async (): Promise<CashbookEntry[]> => [],
  saveCashbook: async (entries: CashbookEntry[]) => {},
};
