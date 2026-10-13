import { apiClient } from './client';

export interface SyncActionPayload {
  id: string;
  orderId: string;
  status: string;
  timestamp: string;
}

export const syncApi = {
  syncQueue: async (queuedActions: SyncActionPayload[]): Promise<{ syncedIds: string[] }> => {
    const response = await apiClient.post<{ syncedIds: string[] }>('/sync', { queuedActions });
    return response.data;
  },
};

export default syncApi;
