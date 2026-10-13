import { create } from 'zustand';
import { walletFinanceApi } from '../api';

export interface WalletSummary {
  partner_id: string;
  available_balance: number;
  pending_balance: number;
  today_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
  lifetime_earnings: number;
  last_settlement_date: string;
  last_settlement_amount: number;
  currency: string;
}

interface WalletState {
  summary: WalletSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchWalletSummary: () => Promise<void>;
  setSummary: (summary: WalletSummary) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  summary: {
    partner_id: 'p-1',
    available_balance: 4250,
    pending_balance: 850,
    today_earnings: 1240,
    weekly_earnings: 7850,
    monthly_earnings: 28400,
    lifetime_earnings: 142500,
    last_settlement_date: new Date(Date.now() - 3600000 * 48).toISOString(),
    last_settlement_amount: 5400,
    currency: 'INR',
  },
  isLoading: false,
  error: null,

  fetchWalletSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await walletFinanceApi.getWalletSummary();
      if (data) {
        set({ summary: data });
      }
    } catch (e: any) {
      console.warn('[useWalletStore] Fetch wallet summary fallback:', e.message);
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setSummary: (summary) => set({ summary }),
}));
