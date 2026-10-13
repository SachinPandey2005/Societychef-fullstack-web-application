import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import { useDashboardStore } from '../store/useDashboardStore';

export interface SettlementFilterState {
  query?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  range?: string;
}

export const useSettlements = (filters?: SettlementFilterState) => {
  const { searchQuery } = useDashboardStore();
  const queryStr = filters?.query !== undefined ? filters.query : searchQuery;

  return useQuery({
    queryKey: ['settlements_list', queryStr, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryStr) params.append('query', queryStr);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.range) params.append('range', filters.range);
      params.append('limit', '100');

      const { data } = await apiClient.get(`/settlements?${params.toString()}`);
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (Array.isArray(data)) return data;
      return [];
    },
  });
};

export const useSettlementSummary = () => {
  return useQuery({
    queryKey: ['settlement_summary_metrics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/settlements/summary');
      return data.data;
    },
  });
};

export const useSettlementDetails = (id: string | null) => {
  return useQuery({
    queryKey: ['settlement_details', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/settlements/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useUpdateSettlementStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/settlements/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements_list'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_summary_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_details'] });
    },
  });
};

export const useBulkUpdateSettlementStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      await apiClient.post('/settlements/bulk-status', { ids, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements_list'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_summary_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_details'] });
    },
  });
};

export const useBulkGenerateSettlements = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { period_start?: string; period_end?: string }) => {
      const { data } = await apiClient.post('/settlements/bulk-generate', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements_list'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_summary_metrics'] });
    },
  });
};

export const usePayChef = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mode, manual_details }: { id: string; mode: 'AUTOMATIC' | 'MANUAL'; manual_details?: any }) => {
      const { data } = await apiClient.post(`/settlements/${id}/pay`, { mode, manual_details });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements_list'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_summary_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_details'] });
      queryClient.invalidateQueries({ queryKey: ['payout_history'] });
    },
  });
};

export const useRetryPayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/settlements/${id}/retry-payment`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements_list'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_summary_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['settlement_details'] });
    },
  });
};

export const useSettlementPayoutHistory = (id: string | null) => {
  return useQuery({
    queryKey: ['payout_history', id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await apiClient.get(`/settlements/${id}/payment-history`);
      return data.data;
    },
    enabled: !!id,
  });
};

