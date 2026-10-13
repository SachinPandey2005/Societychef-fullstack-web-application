import { create } from 'zustand';
import { notificationApi, NotificationItem } from '../api/notification.api';

export interface ExtendedNotificationItem extends NotificationItem {
  type?: 'ORDERS' | 'FINANCE' | 'SUPPORT' | 'REWARDS' | 'ANNOUNCEMENTS' | 'EMERGENCY';
  archived?: boolean;
}

interface NotificationState {
  notifications: ExtendedNotificationItem[];
  filteredNotifications: ExtendedNotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  searchQuery: string;
  activeCategory: 'ALL' | 'ORDERS' | 'FINANCE' | 'SUPPORT' | 'REWARDS' | 'ANNOUNCEMENTS' | 'EMERGENCY';

  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  registerDeviceToken: (token: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: 'ALL' | 'ORDERS' | 'FINANCE' | 'SUPPORT' | 'REWARDS' | 'ANNOUNCEMENTS' | 'EMERGENCY') => void;
  archiveNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  filteredNotifications: [],
  unreadCount: 0,
  isLoading: false,
  searchQuery: '',
  activeCategory: 'ALL',

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const items = await notificationApi.getNotifications();
      // Map mock types to notification items if backend does not provide one, to support categories
      const mapped: ExtendedNotificationItem[] = items.map((item, idx) => {
        const types: Array<ExtendedNotificationItem['type']> = ['ORDERS', 'FINANCE', 'SUPPORT', 'REWARDS', 'ANNOUNCEMENTS', 'EMERGENCY'];
        const type = (item as any).type || types[idx % types.length];
        return {
          ...item,
          type,
          archived: false,
        };
      });

      const unread = mapped.filter((n) => !n.is_read && !n.archived).length;
      set({ notifications: mapped, unreadCount: unread });
      get().setSearchQuery(get().searchQuery); // Refresh filters
    } catch (e) {
      console.warn('Failed to fetch notifications', e);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationIds) => {
    try {
      await notificationApi.markNotificationsAsRead(notificationIds);
      const updated = get().notifications.map((n) =>
        notificationIds.includes(n.id) ? { ...n, is_read: true } : n
      );
      const unread = updated.filter((n) => !n.is_read && !n.archived).length;
      set({ notifications: updated, unreadCount: unread });
      get().setSearchQuery(get().searchQuery); // Refresh filters
    } catch (e) {
      console.warn('Failed to mark notifications as read', e);
    }
  },

  registerDeviceToken: async (token) => {
    try {
      await notificationApi.registerDeviceToken(token);
      console.log(`[NotificationStore] Registered device token: ${token}`);
    } catch (e) {
      console.warn('Failed to register device token', e);
    }
  },

  setSearchQuery: (searchQuery) => {
    const { notifications, activeCategory } = get();
    const query = searchQuery.toLowerCase().trim();

    let filtered = notifications.filter((n) => !n.archived);

    if (activeCategory !== 'ALL') {
      filtered = filtered.filter((n) => n.type === activeCategory);
    }

    if (query) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.body.toLowerCase().includes(query)
      );
    }

    set({ searchQuery, filteredNotifications: filtered });
  },

  setActiveCategory: (activeCategory) => {
    set({ activeCategory });
    get().setSearchQuery(get().searchQuery); // Re-run filter
  },

  archiveNotification: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, archived: true } : n
    );
    const unread = updated.filter((n) => !n.is_read && !n.archived).length;
    set({ notifications: updated, unreadCount: unread });
    get().setSearchQuery(get().searchQuery); // Re-run filter
  },
}));

export default useNotificationStore;
