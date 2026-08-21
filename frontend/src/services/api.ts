import axios from 'axios';
import { Party, Transaction, CashbookEntry, StoreProfile, VoiceCommandParseResult } from '../types';

// Connects to local backend via EXPO_PUBLIC_API_URL or defaults to localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

export const ApiService = {
  getStoreProfile: async (): Promise<StoreProfile> => {
    return {
      name: 'Bismillah General Store',
      ownerName: 'Muhammad Salman',
      mobile: '+92 300 1234567',
      currency: 'Rs',
      language: 'ur',
      expressApiUrl: API_URL,
      isBackendConnected: true,
    };
  },

  saveStoreProfile: async (updated: StoreProfile): Promise<void> => {
    // In a real app, this would make an API call to save the profile.
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
      console.error('Error fetching parties', e);
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
      console.error('Error creating party', e);
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
      console.error('Error creating transaction', e);
      return null;
    }
  },

  processVoice: async (data: FormData | { text: string }): Promise<VoiceCommandParseResult | null> => {
    try {
      const response = await api.post('/voice/process', data);
      return response.data;
    } catch (e) {
      console.error('Error processing voice', e);
      return null;
    }
  },
  
  // Stubs for remaining
  saveParties: async (newParties: Party[]) => {},
  saveTransactions: async (newTxns: Transaction[]) => {},
  getCashbook: async (): Promise<CashbookEntry[]> => [],
  saveCashbook: async (entries: CashbookEntry[]) => {},
};
