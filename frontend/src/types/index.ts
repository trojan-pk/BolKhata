export type TransactionType = 'gave' | 'got';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank' | 'credit' | 'other';

export type PartyType = 'customer' | 'supplier';

export interface Transaction {
  id: string;
  partyId: string;
  partyName: string;
  type: TransactionType; // 'gave' = Udhaar (You gave money/goods), 'got' = Jama (You received money)
  amount: number;
  date: string;
  note?: string;
  paymentMode: PaymentMode;
  billPhotoUrl?: string;
  createdAt: number;
}

export interface Party {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  type: PartyType;
  // Positive balance means "You will get" (Udhaar given), negative means "You will pay" (Jama received)
  currentBalance: number;
  lastUpdated: string;
  avatarColor?: string;
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
  currency: string; // e.g. 'Rs', 'PKR', '₹', '$', '৳'
  language: 'ur' | 'en' | 'hi' | 'bn' | 'es';
  expressApiUrl?: string; // Configurable backend API endpoint for future Express connection
  isBackendConnected?: boolean;
}

export interface VoiceCommandParseResult {
  intent?: 'ADD_CREDIT' | 'ADD_PAYMENT' | 'GET_BALANCE';
  customerName?: string;
  partyName?: string;
  amount?: number;
  description?: string;
  note?: string;
  type?: TransactionType;
  audioBase64?: string;
}
