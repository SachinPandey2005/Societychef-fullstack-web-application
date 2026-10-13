import { apiClient } from './client';

export interface DeviceRecord {
  id: string;
  partner_id: string;
  device_name: string;
  os_type: string;
  app_version: string;
  device_token: string | null;
  last_login_at: string;
  last_sync_at: string;
  is_active: boolean;
  created_at: string;
}

export const devicesApi = {
  getDevices: async (): Promise<DeviceRecord[]> => {
    const response = await apiClient.get<DeviceRecord[]>('/devices');
    return response.data;
  },

  logoutDevice: async (params: { deviceId?: string; logoutAllOthers?: boolean }): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/devices/logout', params);
    return response.data;
  },
};

export default devicesApi;
