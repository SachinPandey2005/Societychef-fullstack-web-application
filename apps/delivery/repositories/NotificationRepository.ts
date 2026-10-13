import { useNotificationStore } from '../store/useNotificationStore';

export class NotificationRepository {
  static async loadNotifications(): Promise<void> {
    const store = useNotificationStore.getState();
    await store.fetchNotifications();
  }

  static async markAsRead(notificationIds: string[]): Promise<void> {
    const store = useNotificationStore.getState();
    await store.markAsRead(notificationIds);
  }

  static async registerPushToken(token: string): Promise<void> {
    const store = useNotificationStore.getState();
    await store.registerDeviceToken(token);
  }

  static filterCategory(category: 'ALL' | 'ORDERS' | 'FINANCE' | 'SUPPORT' | 'REWARDS' | 'ANNOUNCEMENTS' | 'EMERGENCY'): void {
    const store = useNotificationStore.getState();
    store.setActiveCategory(category);
  }

  static search(query: string): void {
    const store = useNotificationStore.getState();
    store.setSearchQuery(query);
  }

  static archive(id: string): void {
    const store = useNotificationStore.getState();
    store.archiveNotification(id);
  }
}

export default NotificationRepository;
