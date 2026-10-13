import { create } from 'zustand';
import { walletFinanceApi } from '../api';

export interface PayoutHistoryItem {
  id: string;
  date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  status: 'PAID' | 'PROCESSING' | 'FAILED';
  receipt_url: string;
}

interface PayoutState {
  payoutHistory: PayoutHistoryItem[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;

  fetchPayoutHistory: () => Promise<void>;
  requestInstantPayout: (amount: number) => Promise<void>;
}

export const usePayoutStore = create<PayoutState>((set) => ({
  payoutHistory: [
    {
      id: 'payout-8801',
      date: new Date(Date.now() - 3600000 * 48).toISOString(),
      amount: 3000,
      payment_method: 'UPI / HDFC Bank',
      reference_number: 'UTR-99182371',
      status: 'PAID',
      receipt_url: 'https://societychef.app/receipts/payout-8801.pdf',
    },
  ],
  isSubmitting: false,
  isLoading: false,
  error: null,

  fetchPayoutHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await walletFinanceApi.getPayoutHistory();
      if (data) {
        set({ payoutHistory: data });
      }
    } catch (e: any) {
      console.warn('[usePayoutStore] Fetch payouts fallback:', e.message);
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  requestInstantPayout: async (amount: number) => {
    set({ isSubmitting: true, error: null });
    try {
      await walletFinanceApi.requestPayout(amount);
    } catch (e: any) {
      console.warn('[usePayoutStore] Request payout error:', e.message);
      throw e;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
