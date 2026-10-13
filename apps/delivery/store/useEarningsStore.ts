import { create } from 'zustand';
import { walletFinanceApi } from '../api';

export interface OrderEarningItem {
  order_id: string;
  order_number: string;
  base_delivery_fee: number;
  distance_pay: number;
  peak_hour_bonus: number;
  festival_bonus: number;
  tip_amount: number;
  penalty_amount: number;
  net_earnings: number;
  completed_at: string;
}

interface EarningsState {
  earningsList: OrderEarningItem[];
  isLoading: boolean;
  error: string | null;

  fetchEarnings: () => Promise<void>;
}

export const useEarningsStore = create<EarningsState>((set) => ({
  earningsList: [
    {
      order_id: 'ord-101',
      order_number: 'ORD-9821',
      base_delivery_fee: 65,
      distance_pay: 20,
      peak_hour_bonus: 15,
      festival_bonus: 0,
      tip_amount: 30,
      penalty_amount: 0,
      net_earnings: 130,
      completed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      order_id: 'ord-102',
      order_number: 'ORD-9804',
      base_delivery_fee: 55,
      distance_pay: 15,
      peak_hour_bonus: 20,
      festival_bonus: 25,
      tip_amount: 50,
      penalty_amount: 0,
      net_earnings: 165,
      completed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      order_id: 'ord-103',
      order_number: 'ORD-9788',
      base_delivery_fee: 60,
      distance_pay: 10,
      peak_hour_bonus: 0,
      festival_bonus: 0,
      tip_amount: 0,
      penalty_amount: 15,
      net_earnings: 55,
      completed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
  isLoading: false,
  error: null,

  fetchEarnings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await walletFinanceApi.getEarningsBreakdown();
      if (data) {
        set({ earningsList: data });
      }
    } catch (e: any) {
      console.warn('[useEarningsStore] Fetch earnings fallback:', e.message);
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
