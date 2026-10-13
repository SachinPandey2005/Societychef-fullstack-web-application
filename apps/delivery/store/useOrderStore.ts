import { create } from 'zustand';
import { orderManagementApi } from '../api';
import { offlineQueueManager } from '../utils/offlineQueue';

export type OrderLifecycleStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'HEADING_TO_CHEF'
  | 'REACHED_CHEF'
  | 'FOOD_PICKED'
  | 'HEADING_TO_CUSTOMER'
  | 'REACHED_CUSTOMER'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface OrderItemDetail {
  id: string;
  quantity: number;
  dishes?: {
    name: string;
    price: number;
  };
}

export interface OrderDetailsFull {
  id: string;
  order_number: string;
  status: OrderLifecycleStatus;
  delivery_fee: number;
  total_amount: number;
  priority: 'VIP' | 'EXPRESS' | 'HIGH_VALUE' | 'FESTIVAL' | 'CORPORATE' | 'NORMAL';
  distance_km: number;
  estimated_delivery_time: number;
  preparation_status: string;
  items_count: number;
  special_instructions?: string;
  allergy_info?: string;
  cooking_instructions?: string;
  packaging_notes?: string;
  delivery_address: string;
  kitchen?: {
    id: string;
    name: string;
    chef_name: string;
    phone: string;
    address: string;
  };
  customer?: {
    id: string;
    full_name: string;
    phone: string;
  };
  items?: OrderItemDetail[];
  created_at: string;
}

interface OrderState {
  ordersList: OrderDetailsFull[];
  activeOrder: OrderDetailsFull | null;
  activeTab: 'AVAILABLE' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  setActiveTab: (tab: 'AVAILABLE' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => void;
  fetchOrdersList: (tab?: string) => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason: string, notes?: string) => Promise<void>;
  advanceOrderStatus: (orderId: string, nextStatus: OrderLifecycleStatus) => Promise<void>;
  setActiveOrder: (order: OrderDetailsFull | null) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  ordersList: [],
  activeOrder: null,
  activeTab: 'ACTIVE',
  isLoading: false,
  isUpdating: false,
  error: null,

  setActiveTab: (activeTab) => set({ activeTab }),

  fetchOrdersList: async (tab = 'ACTIVE') => {
    set({ isLoading: true, error: null });
    try {
      const data = await orderManagementApi.getOrdersList(tab);
      set({ ordersList: data || [] });
    } catch (e: any) {
      console.warn('[useOrderStore] Fetch list warning:', e.message);
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrderById: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await orderManagementApi.getOrderDetails(orderId);
      set({ activeOrder: data });
    } catch (e: any) {
      console.warn('[useOrderStore] Fetch order warning:', e.message);
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  acceptOrder: async (orderId: string) => {
    set({ isUpdating: true });
    try {
      await orderManagementApi.acceptOrder(orderId);
      const active = get().activeOrder;
      if (active && active.id === orderId) {
        set({ activeOrder: { ...active, status: 'ACCEPTED' } });
      }
    } catch (e: any) {
      console.warn('[useOrderStore] Accept order fallback:', e.message);
    } finally {
      set({ isUpdating: false });
    }
  },

  rejectOrder: async (orderId: string, reason: string, notes?: string) => {
    set({ isUpdating: true });
    try {
      await orderManagementApi.rejectOrder(orderId, reason, notes);
      set((state) => ({
        ordersList: state.ordersList.filter((o) => o.id !== orderId),
        activeOrder: state.activeOrder?.id === orderId ? null : state.activeOrder,
      }));
    } catch (e: any) {
      console.warn('[useOrderStore] Reject order fallback:', e.message);
    } finally {
      set({ isUpdating: false });
    }
  },

  advanceOrderStatus: async (orderId: string, nextStatus: OrderLifecycleStatus) => {
    set({ isUpdating: true });
    const currentActive = get().activeOrder;

    // Update optimistic local state immediately
    if (currentActive && currentActive.id === orderId) {
      set({ activeOrder: { ...currentActive, status: nextStatus } });
    }

    try {
      await orderManagementApi.updateOrderStatus(orderId, nextStatus);
    } catch (e: any) {
      console.warn('[useOrderStore] Status update failed online, queueing offline update:', e.message);
      await offlineQueueManager.enqueueStatusUpdate(orderId, nextStatus);
    } finally {
      set({ isUpdating: false });
    }
  },

  setActiveOrder: (activeOrder) => set({ activeOrder }),
}));
