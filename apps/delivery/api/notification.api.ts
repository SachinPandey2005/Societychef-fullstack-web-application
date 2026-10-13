import { apiClient } from './client';

export interface DeviceTokenResponse {
  id: string;
  profile_id: string;
  token: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  profile_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  registerDeviceToken: async (token: string): Promise<DeviceTokenResponse> => {
    const response = await apiClient.post<DeviceTokenResponse>('/notifications/device/register', { token });
    return response.data;
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get<NotificationItem[]>('/notifications');
    return response.data;
  },

  markNotificationsAsRead: async (notificationIds: string[]): Promise<void> => {
    await apiClient.patch('/notifications/read', { notification_ids: notificationIds });
  },
};

export default notificationApi;
