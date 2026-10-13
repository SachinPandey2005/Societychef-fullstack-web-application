import { apiClient } from './client';

export const emergencyApi = {
  triggerSOS: async (params: {
    orderId?: string | null;
    latitude: number;
    longitude: number;
  }): Promise<any> => {
    const response = await apiClient.post('/emergency', params);
    return response.data?.data || response.data;
  },
};

export default emergencyApi;
