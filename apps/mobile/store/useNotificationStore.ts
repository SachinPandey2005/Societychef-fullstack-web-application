import { create } from 'zustand';

export type NotifTone = 'green' | 'gold' | 'blue' | 'red' | 'default';

export type AppNotification = {
  id: string;
  type: 'order_update' | 'free_dish' | 'challenge' | 'promo' | 'chef_order' | 'settlement';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  icon: string;
  tone: NotifTone;
  actionRoute?: string;
};

type NotifState = {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

const SEED: AppNotification[] = [];

export const useNotificationStore = create<NotifState>()((set) => ({
  notifications: [],

  addNotification: (n) =>
    set((s) => ({
      notifications: [
        {
          ...n,
          id: Date.now().toString(),
          read: false,
          timestamp: new Date().toISOString(),
        },
        ...s.notifications,
      ],
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),
}));

export function selectUnreadCount(state: NotifState) {
  return state.notifications.filter((n) => !n.read).length;
}
