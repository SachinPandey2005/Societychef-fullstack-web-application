import { apiClient } from './client';

export const gamificationApi = {
  getAchievements: async (): Promise<any> => {
    const response = await apiClient.get('/partner/achievements');
    return response.data?.data || response.data;
  },

  getTargets: async (): Promise<any> => {
    const response = await apiClient.get('/partner/targets');
    return response.data?.data || response.data;
  },

  getIncentives: async (): Promise<any> => {
    const response = await apiClient.get('/partner/incentives');
    return response.data?.data || response.data;
  },

  getLeaderboard: async (scope: 'SOCIETY' | 'CITY' | 'REGION' | 'COMPANY'): Promise<any> => {
    const response = await apiClient.get(`/partner/leaderboard?scope=${scope}`);
    return response.data?.data || response.data;
  },
};

export default gamificationApi;
