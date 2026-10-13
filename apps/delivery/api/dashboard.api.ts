import { apiClient } from './client';

export const dashboardApi = {
  getDashboardOverview: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/partner/dashboard');
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('[dashboardApi] Overview fetch fallback:', error);
      throw error;
    }
  },

  getPartnerStatus: async (): Promise<any> => {
    const response = await apiClient.get('/partner/status');
    return response.data?.data || response.data;
  },

  updatePartnerStatus: async (status: string, lat?: number, lng?: number): Promise<any> => {
    const response = await apiClient.put('/partner/status', { status, lat, lng });
    return response.data?.data || response.data;
  },

  getShiftInfo: async (): Promise<any> => {
    const response = await apiClient.get('/partner/shift');
    return response.data?.data || response.data;
  },

  getPerformanceStats: async (): Promise<any> => {
    const response = await apiClient.get('/partner/performance');
    return response.data?.data || response.data;
  },

  getNotifications: async (): Promise<any> => {
    const response = await apiClient.get('/partner/notifications');
    return response.data?.data || response.data;
  },

  getAnnouncements: async (): Promise<any> => {
    const response = await apiClient.get('/partner/announcements');
    return response.data?.data || response.data;
  },
};

export default dashboardApi;
