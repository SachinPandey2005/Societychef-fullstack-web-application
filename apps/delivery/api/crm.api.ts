import { apiClient } from './client';

export interface SocietyItem {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

export const crmApi = {
  getSocieties: async (searchQuery: string = ''): Promise<SocietyItem[]> => {
    const response = await apiClient.get<SocietyItem[]>(`/crm/societies?query=${searchQuery}`);
    return response.data;
  },
};

export default crmApi;
