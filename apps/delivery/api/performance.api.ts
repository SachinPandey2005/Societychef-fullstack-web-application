import { apiClient } from './client';

export const performanceApi = {
  getPerformance: async (): Promise<any> => {
    const response = await apiClient.get('/partner/performance');
    return response.data?.data || response.data;
  },

  getRatingsSummary: async (): Promise<any> => {
    const response = await apiClient.get('/partner/ratings');
    return response.data?.data || response.data;
  },

  getReviews: async (): Promise<any> => {
    const response = await apiClient.get('/partner/reviews');
    return response.data?.data || response.data;
  },

  getLearningModules: async (): Promise<any> => {
    const response = await apiClient.get('/partner/learning');
    return response.data?.data || response.data;
  },
};

export default performanceApi;
