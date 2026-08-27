import AsyncStorage from '@react-native-async-storage/async-storage';
import { Party, Transaction, CashbookEntry, StoreProfile } from '../types';
import { supabase } from './supabase';

const KEYS = {
  STORE_PROFILE: 'bolkhata_store_profile_v2',
  PARTIES: 'bolkhata_parties_v2',
  TRANSACTIONS: 'bolkhata_transactions_v2',
  CASHBOOK: 'bolkhata_cashbook_v2',
  /**
   * Whether the first-run intro slides have been shown. Device-scoped, not
   * user-scoped — see `getIntroSeen`.
   */
  INTRO_SEEN: 'bolkhata_intro_seen_v1',
};

// User-scoped key helper so different accounts never leak local data
const userKey = (baseKey: string, userId?: string) =>
  userId ? `${baseKey}_${userId}` : baseKey;

export const INITIAL_STORE_PROFILE: StoreProfile = {
  name: 'My Store',
  ownerName: 'Shopkeeper',
  mobile: '',
  currency: 'Rs',
  language: 'roman_ur',
  expressApiUrl: 'http://localhost:3000',
  isBackendConnected: true,
  accountType: 'commercial',
  businessCategory: 'General Store',
  isOnboarded: false,
};

export const INITIAL_PARTIES: Party[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_CASHBOOK: CashbookEntry[] = [];

export const StorageService = {
  // ---------------------------------------------------------------- First run
  /**
   * Whether the intro slides have already been shown on this device.
   *
   * Deliberately *not* run through `userKey()`: the intro plays before anyone
   * has signed in, so there's no user id to scope it by — and on a shared phone
   * it would be odd to replay the pitch for each account.
   *
   * Fails closed to `true` on a read error, so a storage fault can't trap
   * someone in the intro on every launch.
   */
  getIntroSeen: async (): Promise<boolean> => {
    try {
      return (await AsyncStorage.getItem(KEYS.INTRO_SEEN)) === 'true';
    } catch (e) {
      console.warn('[Storage] Intro flag read error:', e);
      return true;
    }
  },

  setIntroSeen: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.INTRO_SEEN, 'true');
    } catch (e) {
      console.warn('[Storage] Intro flag write error:', e);
    }
  },

  // ------------------------------------------------------------- Store Profile
  getStoreProfile: async (userId?: string): Promise<StoreProfile> => {
    // 1. Try Supabase cloud if authenticated
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          const profile: StoreProfile = {
            name: data.name || 'My Store',
            ownerName: data.owner_name || 'Shopkeeper',
            mobile: data.phone || '',
            currency: data.currency || 'Rs',
            language: data.language || 'roman_ur',
            expressApiUrl: 'http://localhost:3000',
            isBackendConnected: true,
            accountType: data.account_type || 'commercial',
            businessCategory: data.business_category || 'General Store',
            isOnboarded: !!data.is_onboarded,
          };
          await AsyncStorage.setItem(userKey(KEYS.STORE_PROFILE, userId), JSON.stringify(profile));
          return profile;
        }
      } catch (e) {
        console.warn('[Storage] Cloud profile fetch error:', e);
      }
    }

    // 2. Fallback to local AsyncStorage
    try {
      const local = await AsyncStorage.getItem(userKey(KEYS.STORE_PROFILE, userId));
      if (local) return JSON.parse(local);
    } catch (e) {
      // Ignore
    }
    return INITIAL_STORE_PROFILE;
  },

  saveStoreProfile: async (profile: StoreProfile, userId?: string): Promise<void> => {
    // Save to local cache
    try {
      await AsyncStorage.setItem(userKey(KEYS.STORE_PROFILE, userId), JSON.stringify(profile));
    } catch (e) {
      console.error('Error caching store profile locally', e);
    }

    // Sync to Supabase cloud
    if (userId) {
      try {
        await supabase.from('stores').upsert(
          {
            user_id: userId,
            name: profile.name,
            owner_name: profile.ownerName,
            phone: profile.mobile,
            currency: profile.currency,
            language: profile.language,
            account_type: profile.accountType || 'commercial',
            business_category: profile.businessCategory || 'General Store',
            is_onboarded: profile.isOnboarded ?? true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch (e) {
        console.warn('[Storage] Cloud profile save error:', e);
      }
    }
  },

  // ------------------------------------------------------------------- Parties
  getParties: async (userId?: string): Promise<Party[]> => {
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          const parties: Party[] = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            mobile: c.mobile || c.phone || '',
            address: c.address || '',
            type: c.type || 'customer',
            currentBalance: Number(c.balance) || 0,
            lastUpdated: (c.updated_at || c.created_at || '').split('T')[0],
          }));
          await AsyncStorage.setItem(userKey(KEYS.PARTIES, userId), JSON.stringify(parties));
          return parties;
        }
      } catch (e) {
        console.warn('[Storage] Cloud parties fetch error:', e);
      }
    }

    try {
      const local = await AsyncStorage.getItem(userKey(KEYS.PARTIES, userId));
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  },

  saveParties: async (parties: Party[], userId?: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(userKey(KEYS.PARTIES, userId), JSON.stringify(parties));
    } catch (e) {
      console.error('Error saving parties locally', e);
    }

    if (userId && parties.length > 0) {
      try {
        const rows = parties.map((p) => ({
          id: p.id,
          user_id: userId,
          name: p.name,
          mobile: p.mobile,
          phone: p.mobile,
          address: p.address,
          type: p.type,
          balance: p.currentBalance,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('customers').upsert(rows);
      } catch (e) {
        console.warn('[Storage] Cloud parties save error:', e);
      }
    }
  },

  deleteParty: async (partyId: string, userId?: string): Promise<void> => {
    if (userId) {
      try {
        await supabase.from('customers').delete().eq('id', partyId).eq('user_id', userId);
      } catch (e) {
        console.warn('[Storage] Cloud party delete error:', e);
      }
    }
  },

  // -------------------------------------------------------------- Transactions
  getTransactions: async (userId?: string): Promise<Transaction[]> => {
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const txns: Transaction[] = data.map((t: any) => ({
            id: t.id,
            partyId: t.party_id,
            partyName: t.party_name || '',
            type: t.type,
            amount: Number(t.amount) || 0,
            date: t.date || new Date().toISOString().split('T')[0],
            note: t.note || '',
            paymentMode: t.payment_mode || 'cash',
            source: t.source || 'manual',
            createdAt: new Date(t.created_at).getTime(),
          }));
          await AsyncStorage.setItem(userKey(KEYS.TRANSACTIONS, userId), JSON.stringify(txns));
          return txns;
        }
      } catch (e) {
        console.warn('[Storage] Cloud transactions fetch error:', e);
      }
    }

    try {
      const local = await AsyncStorage.getItem(userKey(KEYS.TRANSACTIONS, userId));
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  },

  saveTransactions: async (transactions: Transaction[], userId?: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(userKey(KEYS.TRANSACTIONS, userId), JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions locally', e);
    }

    if (userId && transactions.length > 0) {
      try {
        const rows = transactions.map((t) => ({
          id: t.id,
          user_id: userId,
          party_id: t.partyId,
          party_name: t.partyName,
          type: t.type,
          amount: t.amount,
          date: t.date,
          note: t.note,
          payment_mode: t.paymentMode,
          source: t.source,
          created_at: new Date(t.createdAt).toISOString(),
        }));
        await supabase.from('transactions').upsert(rows);
      } catch (e) {
        console.warn('[Storage] Cloud transactions save error:', e);
      }
    }
  },

  deleteTransaction: async (txnId: string, userId?: string): Promise<void> => {
    if (userId) {
      try {
        await supabase.from('transactions').delete().eq('id', txnId).eq('user_id', userId);
      } catch (e) {
        console.warn('[Storage] Cloud transaction delete error:', e);
      }
    }
  },

  // ------------------------------------------------------------------ Cashbook
  getCashbook: async (userId?: string): Promise<CashbookEntry[]> => {
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('cashbook')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const cash: CashbookEntry[] = data.map((c: any) => ({
            id: c.id,
            type: c.type,
            amount: Number(c.amount) || 0,
            category: c.category || 'General',
            note: c.note || '',
            date: c.date || new Date().toISOString().split('T')[0],
            createdAt: new Date(c.created_at).getTime(),
          }));
          await AsyncStorage.setItem(userKey(KEYS.CASHBOOK, userId), JSON.stringify(cash));
          return cash;
        }
      } catch (e) {
        console.warn('[Storage] Cloud cashbook fetch error:', e);
      }
    }

    try {
      const local = await AsyncStorage.getItem(userKey(KEYS.CASHBOOK, userId));
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  },

  saveCashbook: async (cashbook: CashbookEntry[], userId?: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(userKey(KEYS.CASHBOOK, userId), JSON.stringify(cashbook));
    } catch (e) {
      console.error('Error saving cashbook locally', e);
    }

    if (userId && cashbook.length > 0) {
      try {
        const rows = cashbook.map((c) => ({
          id: c.id,
          user_id: userId,
          type: c.type,
          amount: c.amount,
          category: c.category,
          note: c.note,
          date: c.date,
          created_at: new Date(c.createdAt).toISOString(),
        }));
        await supabase.from('cashbook').upsert(rows);
      } catch (e) {
        console.warn('[Storage] Cloud cashbook save error:', e);
      }
    }
  },

  deleteCashbookEntry: async (id: string, userId?: string): Promise<void> => {
    if (userId) {
      try {
        await supabase.from('cashbook').delete().eq('id', id).eq('user_id', userId);
      } catch (e) {
        console.warn('[Storage] Cloud cashbook delete error:', e);
      }
    }
  },

  // --------------------------------------------------------- Clear user cache
  clearUserStorage: async (userId?: string): Promise<void> => {
    try {
      const keys = [
        userKey(KEYS.STORE_PROFILE, userId),
        userKey(KEYS.PARTIES, userId),
        userKey(KEYS.TRANSACTIONS, userId),
        userKey(KEYS.CASHBOOK, userId),
      ];
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.error('Error clearing user storage', e);
    }
  },
};
