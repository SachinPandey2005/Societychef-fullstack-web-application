import { apiClient } from './client';

export const walletFinanceApi = {
  getWalletSummary: async (): Promise<any> => {
    const response = await apiClient.get('/wallet');
    return response.data?.data || response.data;
  },

  getEarningsBreakdown: async (): Promise<any> => {
    const response = await apiClient.get('/earnings');
    return response.data?.data || response.data;
  },

  getOrderEarningDetail: async (orderId: string): Promise<any> => {
    const response = await apiClient.get(`/earnings/${orderId}`);
    return response.data?.data || response.data;
  },

  getSettlementsList: async (tab?: string): Promise<any> => {
    const query = tab ? `?tab=${encodeURIComponent(tab)}` : '';
    const response = await apiClient.get(`/settlements${query}`);
    return response.data?.data || response.data;
  },

  getSettlementDetail: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/settlements/${id}`);
    return response.data?.data || response.data;
  },

  getTransactionFeed: async (type?: string, search?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.append('type', type);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';

    const response = await apiClient.get(`/transactions${query}`);
    return response.data?.data || response.data;
  },

  getPayoutHistory: async (): Promise<any> => {
    const response = await apiClient.get('/payouts');
    return response.data?.data || response.data;
  },

  updateBankDetails: async (payload: Record<string, any>): Promise<any> => {
    const response = await apiClient.put('/bank-details', payload);
    return response.data?.data || response.data;
  },

  requestPayout: async (amount: number): Promise<any> => {
    const response = await apiClient.post('/payout-request', { amount });
    return response.data?.data || response.data;
  },
};

export default walletFinanceApi;
