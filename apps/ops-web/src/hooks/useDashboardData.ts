import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { apiClient } from '../api/axios';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DateRangeOption = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom';

export interface DateFilterParams {
  range: DateRangeOption;
  startDate?: string;
  endDate?: string;
}

const fetchDashboardStats = async () => {
  const { data } = await apiClient.get('/crm/dashboard');
  return data.data;
};

export const useDashboardData = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: fetchDashboardStats,
    staleTime: 5000,
    refetchInterval: 10000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
        queryClient.invalidateQueries({ queryKey: ['finance_dashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['finance_dashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['finance_dashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests' }, () => {
        queryClient.invalidateQueries({ queryKey: ['finance_dashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useFinanceSummary = (filter: DateFilterParams) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'summary', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/finance-summary', { params: filter });
      return data.data;
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useRevenueAnalytics = (filter: DateFilterParams) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'revenue', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/revenue', { params: filter });
      return data.data;
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useOrdersSummary = (filter: DateFilterParams) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'orders', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/orders-summary', { params: filter });
      return data.data;
    },
    staleTime: 60000,
  });
};

export const usePaymentSummary = (filter: DateFilterParams) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'payments', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/payment-summary', { params: filter });
      return data.data;
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useSettlementsSummary = (filter: DateFilterParams) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'settlements', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/settlements-summary', { params: filter });
      return data.data;
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });
};

export const useTopChefs = (filter: DateFilterParams, limit = 5) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'top_chefs', filter, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/top-chefs', { params: { ...filter, limit } });
      return data.data;
    },
    staleTime: 60000,
  });
};

export const useTopSocieties = (filter: DateFilterParams, limit = 5) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'top_societies', filter, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/top-societies', { params: { ...filter, limit } });
      return data.data;
    },
    staleTime: 60000,
  });
};

export const useRecentFinancialActivity = (limit = 10) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'recent_activity', limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/recent-financial-activity', { params: { limit } });
      return data.data;
    },
    staleTime: 30000,
  });
};

export const usePerformanceMetrics = (filter: DateFilterParams) => {
  return useQuery({
    queryKey: ['finance_dashboard', 'performance_metrics', filter],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/performance-metrics', { params: filter });
      return data.data;
    },
    staleTime: 60000,
  });
};
