import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';

export interface ReportFilterState {
  startDate?: string;
  endDate?: string;
  kitchenId?: string;
  societyId?: string;
  status?: string;
  query?: string;
}

export const useChefEarningsOverview = (kitchenId: string | null) => {
  return useQuery({
    queryKey: ['chef_earnings_overview', kitchenId],
    queryFn: async () => {
      if (!kitchenId) return null;
      const { data } = await apiClient.get(`/analytics/chefs/${kitchenId}/earnings`);
      return data.data;
    },
    enabled: !!kitchenId,
  });
};

export const useChefOrdersBreakdown = (kitchenId: string | null, date?: string) => {
  return useQuery({
    queryKey: ['chef_orders_breakdown', kitchenId, date],
    queryFn: async () => {
      if (!kitchenId) return [];
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      const { data } = await apiClient.get(`/analytics/chefs/${kitchenId}/orders?${params.toString()}`);
      return data.data;
    },
    enabled: !!kitchenId,
  });
};

export const useChefReport = (period: 'daily' | 'weekly' | 'monthly' = 'daily', filters?: ReportFilterState) => {
  return useQuery({
    queryKey: ['chef_report', period, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.kitchenId) params.append('kitchenId', filters.kitchenId);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

      const { data } = await apiClient.get(`/analytics/reports/chef/${period}?${params.toString()}`);
      return data.data;
    },
  });
};

export const useTopChefs = (limit: number = 10, sortBy: string = 'revenue') => {
  return useQuery({
    queryKey: ['top_chefs', limit, sortBy],
    queryFn: async () => {
      const { data } = await apiClient.get(`/analytics/top-chefs?limit=${limit}&sort_by=${sortBy}`);
      return data.data;
    },
  });
};

export const useTopKitchens = (limit: number = 10, sortBy: string = 'revenue') => {
  return useQuery({
    queryKey: ['top_kitchens', limit, sortBy],
    queryFn: async () => {
      const { data } = await apiClient.get(`/analytics/top-kitchens?limit=${limit}&sort_by=${sortBy}`);
      return data.data;
    },
  });
};

export const useExecutiveFinanceSummary = () => {
  return useQuery({
    queryKey: ['executive_finance_summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/reports/finance-summary');
      return data.data;
    },
  });
};

export const useSocietyPerformanceReport = () => {
  return useQuery({
    queryKey: ['society_performance_report'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/reports/society-performance');
      return data.data;
    },
  });
};

export const useRevenueAnalytics = () => {
  return useQuery({
    queryKey: ['revenue_analytics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/revenue');
      return data.data;
    },
  });
};

export const usePaymentAnalytics = () => {
  return useQuery({
    queryKey: ['payment_analytics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/payments');
      return data.data;
    },
  });
};

export const useSettlementAnalytics = () => {
  return useQuery({
    queryKey: ['settlement_analytics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/settlements');
      return data.data;
    },
  });
};
