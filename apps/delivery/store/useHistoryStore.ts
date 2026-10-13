import { create } from 'zustand';

export interface HistoryOrderItem {
  id: string;
  order_number: string;
  status: string;
  delivery_fee: number;
  total_amount: number;
  priority: string;
  kitchen_name: string;
  customer_name: string;
  delivered_at?: string;
  created_at: string;
}

export interface HistoryFilterOptions {
  searchQuery: string;
  statusFilter: string; // 'ALL' | 'DELIVERED' | 'CANCELLED' | 'REJECTED'
  priorityFilter: string; // 'ALL' | 'VIP' | 'EXPRESS' | 'HIGH_VALUE' | 'FESTIVAL' | 'CORPORATE'
  dateRange: 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK';
  societyId: string;
}

interface HistoryState {
  historyList: HistoryOrderItem[];
  filters: HistoryFilterOptions;
  isLoading: boolean;
  error: string | null;

  setHistoryList: (list: HistoryOrderItem[]) => void;
  setFilters: (filters: Partial<HistoryFilterOptions>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFilters: HistoryFilterOptions = {
  searchQuery: '',
  statusFilter: 'ALL',
  priorityFilter: 'ALL',
  dateRange: 'ALL',
  societyId: 'ALL',
};

export const useHistoryStore = create<HistoryState>((set) => ({
  historyList: [
    {
      id: 'ord-hist-1',
      order_number: 'ORD-9102',
      status: 'DELIVERED',
      delivery_fee: 85,
      total_amount: 320,
      priority: 'NORMAL',
      kitchen_name: 'Chef Ananya',
      customer_name: 'Rajesh Kumar',
      delivered_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'ord-hist-2',
      order_number: 'ORD-9088',
      status: 'DELIVERED',
      delivery_fee: 110,
      total_amount: 540,
      priority: 'VIP',
      kitchen_name: 'Gourmet Kitchen Priya',
      customer_name: 'Sunita Rao',
      delivered_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    },
    {
      id: 'ord-hist-3',
      order_number: 'ORD-8942',
      status: 'CANCELLED',
      delivery_fee: 0,
      total_amount: 280,
      priority: 'NORMAL',
      kitchen_name: 'Spice Delight Kitchen',
      customer_name: 'Amit Verma',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'ord-hist-4',
      order_number: 'ORD-8815',
      status: 'CANCELLED',
      delivery_fee: 0,
      total_amount: 410,
      priority: 'EXPRESS',
      kitchen_name: 'Bistro Green Meadows',
      customer_name: 'Kavita Sharma',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
  ],
  filters: initialFilters,
  isLoading: false,
  error: null,

  setHistoryList: (historyList: HistoryOrderItem[]) => set({ historyList, error: null }),
  setFilters: (newFilters: Partial<HistoryFilterOptions>) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () => set({ filters: initialFilters }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));
