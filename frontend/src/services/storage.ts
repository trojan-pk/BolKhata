import AsyncStorage from '@react-native-async-storage/async-storage';
import { Party, Transaction, CashbookEntry, StoreProfile } from '../types';

const KEYS = {
  STORE_PROFILE: 'bolkhata_store_profile_v2',
  PARTIES: 'bolkhata_parties_v2',
  TRANSACTIONS: 'bolkhata_transactions_v2',
  CASHBOOK: 'bolkhata_cashbook_v2',
};

// Initial clean store profile
export const INITIAL_STORE_PROFILE: StoreProfile = {
  name: 'My Store',
  ownerName: 'Shopkeeper',
  mobile: '',
  currency: 'Rs',
  language: 'roman_ur',
  expressApiUrl: 'http://localhost:3000',
  isBackendConnected: true,
};

// Clean empty lists (zero hardcoded dummy data)
export const INITIAL_PARTIES: Party[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_CASHBOOK: CashbookEntry[] = [];

export const StorageService = {
  // Store Profile
  getStoreProfile: async (): Promise<StoreProfile> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.STORE_PROFILE);
      if (!data) return INITIAL_STORE_PROFILE;
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_STORE_PROFILE;
    }
  },

  saveStoreProfile: async (profile: StoreProfile): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.STORE_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving store profile', e);
    }
  },

  // Parties / Customers
  getParties: async (): Promise<Party[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.PARTIES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveParties: async (parties: Party[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.PARTIES, JSON.stringify(parties));
    } catch (e) {
      console.error('Error saving parties', e);
    }
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveTransactions: async (transactions: Transaction[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions', e);
    }
  },

  // Cashbook
  getCashbook: async (): Promise<CashbookEntry[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.CASHBOOK);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCashbook: async (cashbook: CashbookEntry[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.CASHBOOK, JSON.stringify(cashbook));
    } catch (e) {
      console.error('Error saving cashbook', e);
    }
  },

  // Clear all local storage
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.STORE_PROFILE,
        KEYS.PARTIES,
        KEYS.TRANSACTIONS,
        KEYS.CASHBOOK,
        'bolkhata_parties',
        'bolkhata_transactions',
        'bolkhata_cashbook',
        'bolkhata_store_profile',
      ]);
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  }
};
