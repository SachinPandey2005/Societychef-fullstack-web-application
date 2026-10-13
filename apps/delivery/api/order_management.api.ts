import { apiClient } from './client';

export const orderManagementApi = {
  getOrdersList: async (tab?: string): Promise<any> => {
    try {
      const endpoint = tab ? `/delivery/orders?tab=${encodeURIComponent(tab)}` : '/delivery/orders';
      const response = await apiClient.get(endpoint);
      return response.data?.data || response.data;
    } catch (e) {
      console.warn('[orderManagementApi] getOrdersList fallback:', e);
      throw e;
    }
  },

  getOrderDetails: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/delivery/orders/${id}`);
    return response.data?.data || response.data;
  },

  acceptOrder: async (id: string): Promise<any> => {
    const response = await apiClient.put(`/delivery/orders/${id}/accept`);
    return response.data?.data || response.data;
  },

  rejectOrder: async (id: string, reason: string, notes?: string): Promise<any> => {
    const response = await apiClient.put(`/delivery/orders/${id}/reject`, { reason, notes });
    return response.data?.data || response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<any> => {
    const response = await apiClient.put(`/delivery/orders/${id}/status`, { status });
    return response.data?.data || response.data;
  },

  getOrderHistory: async (params?: Record<string, any>): Promise<any> => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await apiClient.get(`/delivery/history${query}`);
    return response.data?.data || response.data;
  },
};

export default orderManagementApi;
