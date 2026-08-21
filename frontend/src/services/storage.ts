import AsyncStorage from '@react-native-async-storage/async-storage';
import { Party, Transaction, CashbookEntry, StoreProfile } from '../types';

const KEYS = {
  STORE_PROFILE: 'bolkhata_store_profile',
  PARTIES: 'bolkhata_parties',
  TRANSACTIONS: 'bolkhata_transactions',
  CASHBOOK: 'bolkhata_cashbook',
};

// Initial realistic seed data for store owners
export const INITIAL_STORE_PROFILE: StoreProfile = {
  name: 'Bismillah General Store',
  ownerName: 'Muhammad Salman',
  mobile: '+92 300 1234567',
  currency: 'Rs',
  language: 'ur',
  expressApiUrl: 'http://localhost:3000',
  isBackendConnected: true,
};

export const INITIAL_PARTIES: Party[] = [
  {
    id: 'p1',
    name: 'Ramesh Kumar (Grocery)',
    mobile: '9812345678',
    address: 'Shop #12, Main Market',
    type: 'customer',
    currentBalance: 4500, // Aap lenge ₹4,500
    lastUpdated: '2026-08-20',
    avatarColor: '#2563eb',
  },
  {
    id: 'p2',
    name: 'Sunita Devi',
    mobile: '9898765432',
    address: 'House 44, Civil Lines',
    type: 'customer',
    currentBalance: 1850, // Aap lenge ₹1,850
    lastUpdated: '2026-08-19',
    avatarColor: '#ec4899',
  },
  {
    id: 'p3',
    name: 'Amrit Rice Supplier',
    mobile: '9711223344',
    address: 'Grain Market Yard',
    type: 'supplier',
    currentBalance: -3200, // Aap denge ₹3,200
    lastUpdated: '2026-08-18',
    avatarColor: '#f59e0b',
  },
  {
    id: 'p4',
    name: 'Vikas Sharma',
    mobile: '9988776655',
    address: 'Station Road',
    type: 'customer',
    currentBalance: 8500, // Aap lenge ₹8,500
    lastUpdated: '2026-08-20',
    avatarColor: '#10b981',
  },
  {
    id: 'p5',
    name: 'Pooja Traders',
    mobile: '9844556677',
    address: 'Wholesale Complex',
    type: 'supplier',
    currentBalance: 0, // Cleared balance
    lastUpdated: '2026-08-15',
    avatarColor: '#8b5cf6',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    partyId: 'p1',
    partyName: 'Ramesh Kumar (Grocery)',
    type: 'gave',
    amount: 5000,
    date: '2026-08-15',
    note: '5 bags Basmati Rice & Oil tin',
    paymentMode: 'credit',
    createdAt: Date.now() - 500000,
  },
  {
    id: 't2',
    partyId: 'p1',
    partyName: 'Ramesh Kumar (Grocery)',
    type: 'got',
    amount: 500,
    date: '2026-08-20',
    note: 'Part payment via GPay UPI',
    paymentMode: 'upi',
    createdAt: Date.now() - 200000,
  },
  {
    id: 't3',
    partyId: 'p2',
    partyName: 'Sunita Devi',
    type: 'gave',
    amount: 1850,
    date: '2026-08-19',
    note: 'Monthly ration credit',
    paymentMode: 'credit',
    createdAt: Date.now() - 300000,
  },
  {
    id: 't4',
    partyId: 'p3',
    partyName: 'Amrit Rice Supplier',
    type: 'got', // Received stock inventory credit
    amount: 3200,
    date: '2026-08-18',
    note: 'Wheat stock delivery',
    paymentMode: 'credit',
    createdAt: Date.now() - 400000,
  },
];

export const INITIAL_CASHBOOK: CashbookEntry[] = [
  {
    id: 'c1',
    type: 'in',
    amount: 3500,
    category: 'Daily Cash Sale',
    note: 'Counter sales morning session',
    date: '2026-08-20',
    createdAt: Date.now() - 100000,
  },
  {
    id: 'c2',
    type: 'out',
    amount: 450,
    category: 'Tea & Refreshment',
    note: 'Weekly tea boy settlement',
    date: '2026-08-20',
    createdAt: Date.now() - 80000,
  },
  {
    id: 'c3',
    type: 'out',
    amount: 650,
    category: 'Electricity & Shop maintenance',
    note: 'Fan repair worker',
    date: '2026-08-19',
    createdAt: Date.now() - 250000,
  },
];

export const StorageService = {
  // Store Profile
  getStoreProfile: async (): Promise<StoreProfile> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.STORE_PROFILE);
      return data ? JSON.parse(data) : INITIAL_STORE_PROFILE;
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
      return data ? JSON.parse(data) : INITIAL_PARTIES;
    } catch (e) {
      return INITIAL_PARTIES;
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
      return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
    } catch (e) {
      return INITIAL_TRANSACTIONS;
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
      return data ? JSON.parse(data) : INITIAL_CASHBOOK;
    } catch (e) {
      return INITIAL_CASHBOOK;
    }
  },

  saveCashbook: async (cashbook: CashbookEntry[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.CASHBOOK, JSON.stringify(cashbook));
    } catch (e) {
      console.error('Error saving cashbook', e);
    }
  },
};
