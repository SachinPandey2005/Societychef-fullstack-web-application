import { create } from 'zustand';

export interface IncomingOrderPayload {
  id: string;
  order_number: string;
  kitchen_name: string;
  chef_name: string;
  pickup_address: string;
  customer_name: string;
  drop_address: string;
  distance_km: number;
  estimated_delivery_time: number;
  delivery_fee: number;
  priority: 'VIP' | 'EXPRESS' | 'HIGH_VALUE' | 'FESTIVAL' | 'CORPORATE' | 'NORMAL';
  order_value: number;
  preparation_status: string;
  items_count: number;
  special_instructions?: string;
  expires_in_seconds?: number;
}

interface AssignmentState {
  incomingOrder: IncomingOrderPayload | null;
  showIncomingModal: boolean;
  countdownSeconds: number;
  timerActive: boolean;

  setIncomingOrder: (order: IncomingOrderPayload | null) => void;
  startCountdown: (initialSeconds?: number) => void;
  decrementCountdown: () => void;
  dismissModal: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  incomingOrder: null,
  showIncomingModal: false,
  countdownSeconds: 30,
  timerActive: false,

  setIncomingOrder: (order: IncomingOrderPayload | null) => {
    if (order) {
      set({
        incomingOrder: order,
        showIncomingModal: true,
        countdownSeconds: order.expires_in_seconds || 30,
        timerActive: true,
      });
    } else {
      set({
        incomingOrder: null,
        showIncomingModal: false,
        timerActive: false,
      });
    }
  },

  startCountdown: (initialSeconds = 30) => {
    set({ countdownSeconds: initialSeconds, timerActive: true });
  },

  decrementCountdown: () => {
    const current = get().countdownSeconds;
    if (current <= 1) {
      set({ countdownSeconds: 0, timerActive: false });
    } else {
      set({ countdownSeconds: current - 1 });
    }
  },

  dismissModal: () => {
    set({ showIncomingModal: false, incomingOrder: null, timerActive: false });
  },
}));
