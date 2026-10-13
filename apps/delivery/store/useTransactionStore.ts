import { create } from 'zustand';
import { walletFinanceApi } from '../api';

export type TransactionFilterType = 'ALL' | 'CREDIT' | 'DEBIT' | 'BONUS' | 'PENALTY';

export interface TransactionItem {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'BONUS' | 'PENALTY';
  category: string;
  amount: number;
  description: string;
  created_at: string;
}

interface TransactionState {
  transactionsList: TransactionItem[];
  filterType: TransactionFilterType;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  setFilterType: (type: TransactionFilterType) => void;
  setSearchQuery: (query: string) => void;
  fetchTransactions: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactionsList: [
    {
      id: 'txn-1001',
      type: 'CREDIT',
      category: 'ORDER_EARNING',
      amount: 130,
      description: 'Order #ORD-9821 Base + Surge + Tip',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'txn-1002',
      type: 'BONUS',
      category: 'WEEKEND_BONUS',
      amount: 250,
      description: 'Completed 25 orders weekend milestone reward',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'txn-1003',
      type: 'PENALTY',
      category: 'LATE_DELIVERY',
      amount: 15,
      description: 'Late delivery penalty for #ORD-9788',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'txn-1004',
      type: 'DEBIT',
      category: 'INSTANT_PAYOUT',
      amount: 3000,
      description: 'Payout transfer to HDFC Bank (UTR-99182371)',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ],
  filterType: 'ALL',
  searchQuery: '',
  isLoading: false,
  error: null,

  setFilterType: (filterType) => {
    set({ filterType });
    get().fetchTransactions();
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await walletFinanceApi.getTransactionFeed(get().filterType, get().searchQuery);
      if (data) {
        set({ transactionsList: data });
      }
    } catch (e: any) {
      console.warn('[useTransactionStore] Fetch transactions fallback:', e.message);
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
