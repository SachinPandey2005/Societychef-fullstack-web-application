import { apiClient } from './client';

export const incidentApi = {
  reportIncident: async (params: {
    incidentType: string;
    description: string;
    evidenceUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    orderId?: string | null;
  }): Promise<any> => {
    const response = await apiClient.post('/incident', params);
    return response.data?.data || response.data;
  },
};

export default incidentApi;
