import { apiClient } from './client';

export const rewardsApi = {
  getRewards: async (): Promise<any> => {
    const response = await apiClient.get('/partner/rewards');
    return response.data?.data || response.data;
  },

  redeemReward: async (rewardId: string): Promise<any> => {
    const response = await apiClient.post('/partner/rewards/redeem', { rewardId });
    return response.data?.data || response.data;
  },
};

export default rewardsApi;
