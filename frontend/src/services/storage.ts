import AsyncStorage from '@react-native-async-storage/async-storage';
import { Party, Transaction, CashbookEntry, StoreProfile } from '../types';
import { supabase } from './supabase';
import { isUuid, uuid } from '../utils/uuid';
import { normalizeLegacyIds } from '../utils/ledger';

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

/** PostgREST rejects oversized payloads — keep upsert batches modest. */
const UPSERT_CHUNK = 400;

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

/* ------------------------------------------------------------- internals -- */

/** Upserts rows sequentially in chunks; logs (never throws) on failure. */
async function upsertChunked(table: string, rows: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + UPSERT_CHUNK));
    if (error) {
      console.warn(`[Storage] Cloud upsert failed (${table}):`, error.message);
      return;
    }
  }
}

async function readLocal<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeLocal(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] Local write error:', e);
  }
}

/**
 * Reads the user's local parties/transactions/cashbook, repairs legacy
 * non-UUID ids (cloud PKs are UUIDs), and persists the repaired arrays so the
 * new ids stick across launches.
 */
async function readLocalLedger(userId?: string): Promise<{
  parties: Party[];
  transactions: Transaction[];
  cashbook: CashbookEntry[];
}> {
  const [parties, transactions, cashbook] = await Promise.all([
    readLocal<Party[]>(userKey(KEYS.PARTIES, userId), []),
    readLocal<Transaction[]>(userKey(KEYS.TRANSACTIONS, userId), []),
    readLocal<CashbookEntry[]>(userKey(KEYS.CASHBOOK, userId), []),
  ]);

  const repaired = normalizeLegacyIds(parties, transactions, cashbook);
  if (repaired.changed) {
    await Promise.all([
      writeLocal(userKey(KEYS.PARTIES, userId), repaired.parties),
      writeLocal(userKey(KEYS.TRANSACTIONS, userId), repaired.transactions),
      writeLocal(userKey(KEYS.CASHBOOK, userId), repaired.cashbook),
    ]);
  }
  return repaired;
}

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
          await AsyncStorage.setItem(
            userKey(KEYS.STORE_PROFILE, userId),
            JSON.stringify(profile)
          );
          return profile;
        }
        if (error) {
          console.warn('[Storage] Cloud profile fetch error:', error.message);
        }
      } catch (e) {
        console.warn('[Storage] Cloud profile fetch error:', e);
      }
    }

    // 2. Fallback to local AsyncStorage
    return readLocal<StoreProfile>(userKey(KEYS.STORE_PROFILE, userId), INITIAL_STORE_PROFILE);
  },

  saveStoreProfile: async (profile: StoreProfile, userId?: string): Promise<void> => {
    // Save to local cache
    await writeLocal(userKey(KEYS.STORE_PROFILE, userId), profile);

    // Sync to Supabase cloud (one row per user)
    if (userId) {
      try {
        const { error } = await supabase.from('stores').upsert(
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
        if (error) {
          console.warn('[Storage] Cloud profile save error:', error.message);
        }
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
            mobile: c.phone || '',
            address: c.address || '',
            type: c.type || 'customer',
            currentBalance: Number(c.balance) || 0,
            lastUpdated: (c.updated_at || c.created_at || '').split('T')[0],
          }));
          await writeLocal(userKey(KEYS.PARTIES, userId), parties);
          return parties;
        }
        if (error) {
          console.warn('[Storage] Cloud parties fetch error:', error.message);
        }
      } catch (e) {
        console.warn('[Storage] Cloud parties fetch error:', e);
      }
    }

    const { parties } = await readLocalLedger(userId);
    return parties;
  },

  saveParties: async (parties: Party[], userId?: string): Promise<void> => {
    await writeLocal(userKey(KEYS.PARTIES, userId), parties);

    if (userId && parties.length > 0) {
      const rows = parties.map((p) => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        phone: p.mobile,
        address: p.address,
        type: p.type,
        balance: p.currentBalance,
        updated_at: new Date().toISOString(),
      }));
      await upsertChunked('customers', rows);
    }
  },

  deleteParty: async (partyId: string, userId?: string): Promise<void> => {
    if (userId) {
      try {
        // transactions rows cascade on delete at the database level.
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', partyId)
          .eq('user_id', userId);
        if (error) {
          console.warn('[Storage] Cloud party delete error:', error.message);
        }
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
            partyId: t.customer_id,
            partyName: t.party_name || '',
            type: t.type,
            amount: Number(t.amount) || 0,
            date: t.date || new Date().toISOString().split('T')[0],
            note: t.note || '',
            paymentMode: t.payment_mode || 'cash',
            source: t.source || 'manual',
            createdAt: new Date(t.created_at).getTime(),
          }));
          await writeLocal(userKey(KEYS.TRANSACTIONS, userId), txns);
          return txns;
        }
        if (error) {
          console.warn('[Storage] Cloud transactions fetch error:', error.message);
        }
      } catch (e) {
        console.warn('[Storage] Cloud transactions fetch error:', e);
      }
    }

    const { transactions } = await readLocalLedger(userId);
    return transactions;
  },

  /**
   * Call after `saveParties` — entries reference customers by UUID, so the
   * parents must land first or the foreign key rejects the batch.
   */
  saveTransactions: async (transactions: Transaction[], userId?: string): Promise<void> => {
    await writeLocal(userKey(KEYS.TRANSACTIONS, userId), transactions);

    if (userId && transactions.length > 0) {
      const rows = transactions.map((t) => ({
        id: t.id,
        user_id: userId,
        customer_id: t.partyId,
        party_name: t.partyName,
        type: t.type,
        amount: t.amount,
        note: t.note ?? '',
        payment_mode: t.paymentMode || 'cash',
        date: t.date,
        source: t.source || 'manual',
        created_at: new Date(t.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await upsertChunked('transactions', rows);
    }
  },

  deleteTransaction: async (txnId: string, userId?: string): Promise<void> => {
    if (userId) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', txnId)
          .eq('user_id', userId);
        if (error) {
          console.warn('[Storage] Cloud transaction delete error:', error.message);
        }
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
          await writeLocal(userKey(KEYS.CASHBOOK, userId), cash);
          return cash;
        }
        if (error) {
          console.warn('[Storage] Cloud cashbook fetch error:', error.message);
        }
      } catch (e) {
        console.warn('[Storage] Cloud cashbook fetch error:', e);
      }
    }

    const { cashbook } = await readLocalLedger(userId);
    return cashbook;
  },

  saveCashbook: async (cashbook: CashbookEntry[], userId?: string): Promise<void> => {
    await writeLocal(userKey(KEYS.CASHBOOK, userId), cashbook);

    if (userId && cashbook.length > 0) {
      const rows = cashbook.map((c) => ({
        id: c.id,
        user_id: userId,
        type: c.type,
        amount: c.amount,
        category: c.category,
        note: c.note ?? '',
        date: c.date,
        created_at: new Date(c.createdAt).toISOString(),
      }));
      await upsertChunked('cashbook', rows);
    }
  },

  deleteCashbookEntry: async (id: string, userId?: string): Promise<void> => {
    if (userId) {
      try {
        const { error } = await supabase
          .from('cashbook')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) {
          console.warn('[Storage] Cloud cashbook delete error:', error.message);
        }
      } catch (e) {
        console.warn('[Storage] Cloud cashbook delete error:', e);
      }
    }
  },

  // ------------------------------------------------------------- one-off sync
  /**
   * First-sign-in repair: if the user has local ledger data but the cloud
   * tables are empty (e.g. rows previously rejected by the old schema
   * mismatch), push the local data up — in FK order (customers → entries).
   * Cloud rows are never overwritten, only added when the table is empty.
   */
  migrateLocalToCloud: async (userId: string): Promise<void> => {
    try {
      const { parties, transactions, cashbook } = await readLocalLedger(userId);
      if (parties.length === 0 && transactions.length === 0 && cashbook.length === 0) return;

      const [{ count: customerCount }, { count: txnCount }, { count: cashCount }] =
        await Promise.all([
          supabase.from('customers').select('id', { count: 'exact', head: true }),
          supabase.from('transactions').select('id', { count: 'exact', head: true }),
          supabase.from('cashbook').select('id', { count: 'exact', head: true }),
        ]);

      if ((customerCount ?? 0) === 0 && parties.length > 0) {
        await StorageService.saveParties(parties, userId);
      }
      if ((txnCount ?? 0) === 0 && transactions.length > 0) {
        await StorageService.saveTransactions(transactions, userId);
      }
      if ((cashCount ?? 0) === 0 && cashbook.length > 0) {
        await StorageService.saveCashbook(cashbook, userId);
      }
    } catch (e) {
      console.warn('[Storage] Local→cloud migration error:', e);
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
      console.warn('[Storage] Error clearing user storage:', e);
    }
  },
};

/** Generates a fresh UUID id for a locally-created row (exported for callers). */
export const newId = (): string => uuid();

/** True when an id already satisfies the cloud schema's UUID keys. */
export const isValidCloudId = (id: string | undefined): boolean => isUuid(id);
