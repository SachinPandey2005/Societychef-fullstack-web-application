import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/axios';

export interface RefundFilterParams {
  status?: string;
  type?: string;
  query?: string;
}

export function useRefunds(filters?: RefundFilterParams) {
  return useQuery({
    queryKey: ['refunds', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/refunds', { params: filters });
      return data.data || [];
    },
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { order_id: string; amount?: number; reason: string; type?: string; refund_id?: string }) => {
      const { data } = await apiClient.post('/refunds/process', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
    },
  });
}

export function useApproveRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (refund_id: string) => {
      const { data } = await apiClient.post('/refunds/approve', { refund_id });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
    },
  });
}

export function useFinancialAdjustments() {
  return useQuery({
    queryKey: ['adjustments'],
    queryFn: async () => {
      const { data } = await apiClient.get('/adjustments');
      return data.data || [];
    },
  });
}

export function useCreateFinancialAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      adjustment_type: string;
      target_type: string;
      target_id: string;
      amount: number;
      entry_type: string;
      reason: string;
      supporting_notes?: string;
    }) => {
      const { data } = await apiClient.post('/adjustments', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    },
  });
}

export function useDisputes(filters?: any) {
  return useQuery({
    queryKey: ['disputes', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/disputes', { params: filters });
      return data.data || [];
    },
  });
}

export function useUpdateDisputeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { id: string; status: string; resolution_notes?: string }) => {
      const { data } = await apiClient.patch(`/disputes/${id}`, { status, resolution_notes });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}
