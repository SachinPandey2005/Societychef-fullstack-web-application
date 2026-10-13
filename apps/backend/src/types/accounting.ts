export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  created_at?: string;
}

export interface JournalEntry {
  id: string;
  transaction_date: string;
  description: string;
  reference_type: string; // e.g., 'ORDER', 'REFUND', 'SETTLEMENT'
  reference_id: string;
  total_amount: number;
  created_at?: string;
}

export interface JournalLine {
  id: string;
  journal_id: string;
  account_id: string;
  is_credit: boolean;
  amount: number;
}

export interface TaxRecord {
  id: string;
  order_id: string;
  tax_type: 'GST' | 'VAT'; // extensible
  tax_rate: number;
  tax_amount: number;
  created_at?: string;
}
