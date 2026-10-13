export type WalletOwnerType = 'CONSUMER' | 'CHEF' | 'PLATFORM';

export interface Wallet {
  id: string;
  user_id?: string;
  wallet_type: WalletOwnerType;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  created_at?: string;
  updated_at?: string;
}

export type WalletTransactionType = 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'REVERSAL' | 'ADJUSTMENT';

export interface WalletTransaction {
  id: string;
  transaction_id: string;
  wallet_id: string;
  amount: number;
  type: WalletTransactionType;
  source: string;
  reference_id?: string;
  order_id?: string;
  payment_id?: string;
  created_at?: string;
}

export interface LedgerEntry {
  id: string;
  debit_wallet_id?: string;
  credit_wallet_id?: string;
  amount: number;
  currency: string;
  transaction_reference?: string;
  description: string;
  created_at?: string;
}
