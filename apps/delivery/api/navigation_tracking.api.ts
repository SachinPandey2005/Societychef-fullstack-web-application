import { apiClient } from './client';

export const navigationTrackingApi = {
  updateLocation: async (telemetry: Record<string, any>): Promise<any> => {
    const response = await apiClient.post('/location/update', telemetry);
    return response.data?.data || response.data;
  },

  calculateRoute: async (params: {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
    route_type?: string;
  }): Promise<any> => {
    const query = `?${new URLSearchParams(params as any).toString()}`;
    const response = await apiClient.get(`/navigation/route${query}`);
    return response.data?.data || response.data;
  },

  calculateEta: async (params: {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
  }): Promise<any> => {
    const query = `?${new URLSearchParams(params as any).toString()}`;
    const response = await apiClient.get(`/navigation/eta${query}`);
    return response.data?.data || response.data;
  },

  startTracking: async (orderId: string): Promise<any> => {
    const response = await apiClient.post('/tracking/start', { order_id: orderId });
    return response.data?.data || response.data;
  },

  stopTracking: async (orderId: string): Promise<any> => {
    const response = await apiClient.post('/tracking/stop', { order_id: orderId });
    return response.data?.data || response.data;
  },

  getOrderTracking: async (orderId: string): Promise<any> => {
    const response = await apiClient.get(`/tracking/order/${orderId}`);
    return response.data?.data || response.data;
  },
};

export default navigationTrackingApi;
