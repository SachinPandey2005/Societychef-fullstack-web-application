import { create } from 'zustand';
import { walletFinanceApi } from '../api';

export type SettlementTabType = 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED';

export interface SettlementItem {
  id: string;
  settlement_period: string;
  orders_included_count: number;
  gross_amount: number;
  adjustments_amount: number;
  net_amount: number;
  status: SettlementTabType;
  paid_at: string | null;
  reference_number: string | null;
}

interface SettlementState {
  settlementsList: SettlementItem[];
  activeTab: SettlementTabType;
  isLoading: boolean;
  error: string | null;

  setActiveTab: (tab: SettlementTabType) => void;
  fetchSettlements: (tab?: SettlementTabType) => Promise<void>;
}

export const useSettlementStore = create<SettlementState>((set, get) => ({
  settlementsList: [
    {
      id: 'settle-901',
      settlement_period: '22 Jul 2026 - 28 Jul 2026',
      orders_included_count: 42,
      gross_amount: 5800,
      adjustments_amount: -150,
      net_amount: 5650,
      status: 'PAID',
      paid_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      reference_number: 'BANK-UTR-99182371',
    },
    {
      id: 'settle-902',
      settlement_period: '29 Jul 2026 - Present',
      orders_included_count: 12,
      gross_amount: 1450,
      adjustments_amount: 0,
      net_amount: 1450,
      status: 'PROCESSING',
      paid_at: null,
      reference_number: null,
    },
  ],
  activeTab: 'PAID',
  isLoading: false,
  error: null,

  setActiveTab: (activeTab) => {
    set({ activeTab });
    get().fetchSettlements(activeTab);
  },

  fetchSettlements: async (tab) => {
    set({ isLoading: true, error: null });
    try {
      const data = await walletFinanceApi.getSettlementsList(tab || get().activeTab);
      if (data) {
        set({ settlementsList: data });
      }
    } catch (e: any) {
      console.warn('[useSettlementStore] Fetch settlements fallback:', e.message);
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
