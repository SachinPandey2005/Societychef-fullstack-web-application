import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/axios';

export const usePartnerProfile = (partnerId: string | null) => {
  return useQuery({
    queryKey: ['partner-profile', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data } = await apiClient.get(`/crm/delivery-partners/${partnerId}`);
      return data.data;
    },
    enabled: !!partnerId,
  });
};

export const usePartnerOrders = (partnerId: string | null) => {
  return useQuery({
    queryKey: ['partner-orders', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data } = await apiClient.get(`/crm/delivery-partners/${partnerId}/orders`);
      return data.data;
    },
    enabled: !!partnerId,
  });
};

export const usePartnerEarnings = (partnerId: string | null) => {
  return useQuery({
    queryKey: ['partner-earnings', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data } = await apiClient.get(`/crm/delivery-partners/${partnerId}/earnings`);
      return data.data;
    },
    enabled: !!partnerId,
  });
};

export const usePartnerWallet = (partnerId: string | null) => {
  return useQuery({
    queryKey: ['partner-wallet', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data } = await apiClient.get(`/crm/delivery-partners/${partnerId}/wallet`);
      return data.data;
    },
    enabled: !!partnerId,
  });
};

export const usePartnerSettlements = (partnerId: string | null) => {
  return useQuery({
    queryKey: ['partner-settlements', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data } = await apiClient.get(`/crm/delivery-partners/${partnerId}/settlements`);
      return data.data;
    },
    enabled: !!partnerId,
  });
};

export const usePartnerNotifications = (partnerId: string | null) => {
  return useQuery({
    queryKey: ['partner-notifications', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data } = await apiClient.get(`/crm/delivery-partners/${partnerId}/notifications`);
      return data.data;
    },
    enabled: !!partnerId,
  });
};

export const usePartnerDocuments = (partnerId: string | null) => {
  return useQuery({
    queryKey: ['partner-documents', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data } = await apiClient.get(`/crm/delivery-partners/${partnerId}/documents`);
      return data.data;
    },
    enabled: !!partnerId,
  });
};

// Mutations
export const useAssignOrderToPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, orderId }: { partnerId: string; orderId: string }) => {
      const { data } = await apiClient.post(`/crm/delivery-partners/${partnerId}/orders/assign`, { order_id: orderId });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partner-orders', variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: ['partner-profile', variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
    }
  });
};

export const useApprovePartnerKyc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { data } = await apiClient.post(`/crm/delivery-partners/${partnerId}/kyc/approve`);
      return data.data;
    },
    onSuccess: (_, partnerId) => {
      queryClient.invalidateQueries({ queryKey: ['partner-profile', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['partner-documents', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    }
  });
};

export const useRejectPartnerKyc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, reason, flaggedDocs }: { partnerId: string; reason: string; flaggedDocs: string[] }) => {
      const { data } = await apiClient.post(`/crm/delivery-partners/${partnerId}/kyc/reject`, { reason, flaggedDocs });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partner-profile', variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: ['partner-documents', variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    }
  });
};

export const useSuspendPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { data } = await apiClient.post(`/crm/delivery-partners/${partnerId}/suspend`);
      return data.data;
    },
    onSuccess: (_, partnerId) => {
      queryClient.invalidateQueries({ queryKey: ['partner-profile', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
    }
  });
};

export const useActivatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { data } = await apiClient.post(`/crm/delivery-partners/${partnerId}/activate`);
      return data.data;
    },
    onSuccess: (_, partnerId) => {
      queryClient.invalidateQueries({ queryKey: ['partner-profile', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
    }
  });
};

export const useUpdatePartnerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, fields }: { partnerId: string; fields: any }) => {
      const { data } = await apiClient.patch(`/crm/delivery-partners/${partnerId}`, fields);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partner-profile', variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
    }
  });
};

export const useDeletePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { data } = await apiClient.delete(`/crm/delivery-partners/${partnerId}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-partners'] });
    }
  });
};
