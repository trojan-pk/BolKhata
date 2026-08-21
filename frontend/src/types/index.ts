export type TransactionType = 'gave' | 'got';
export type PaymentMode = 'cash' | 'online' | 'credit' | 'upi' | 'card';
export type PartyType = 'customer' | 'supplier';

export interface Party {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  type: PartyType;
  currentBalance: number; // Derived/cached sum of (gave - got)
  lastUpdated: string;
  avatarColor?: string;
}

export interface Transaction {
  id: string;
  partyId: string;
  partyName: string;
  type: TransactionType; // 'gave' | 'got'
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string; // Reason / Item description
  paymentMode?: string;
  source?: 'voice' | 'manual';
  createdAt: number;
}

export interface CashbookEntry {
  id: string;
  type: 'in' | 'out';
  amount: number;
  category: string;
  note: string;
  date: string;
  createdAt: number;
}

export interface StoreProfile {
  name: string;
  ownerName: string;
  mobile: string;
  currency: string;
  language: 'ur' | 'roman_ur' | 'en' | 'hi' | 'bn' | 'es';
  expressApiUrl?: string;
  isBackendConnected?: boolean;
}

export interface VoiceCommandParseResult {
  intent: 'create_transaction' | 'get_balance' | 'get_history' | 'search_person' | 'unknown';
  person: {
    name: string;
    matched_person_id?: string | null;
  };
  transaction?: {
    direction: 'gave' | 'got';
    amount: number;
    currency: string;
    reason?: string | null;
    date: string;
    payment_method?: string | null;
  };
  ambiguous?: boolean;
  candidates?: { id: string; name: string }[];
  missing_fields?: string[];
  confidence?: number;
  audioBase64?: string;
  originalText?: string;
}
