import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import { useDashboardStore } from '../store/useDashboardStore';

const fetchCrmData = async (type: 'chefs' | 'customers' | 'societies' | 'delivery-partners', query: string, page: number) => {
  const { data } = await apiClient.get(`/crm/${type}?query=${query}&page=${page}&limit=20`);
  return data.data;
};

export const useChefs = () => {
  const { searchQuery, currentPage } = useDashboardStore();
  return useQuery({
    queryKey: ['chefs', searchQuery, currentPage],
    queryFn: () => fetchCrmData('chefs', searchQuery, currentPage),
  });
};

export const useConsumers = () => {
  const { searchQuery, currentPage } = useDashboardStore();
  return useQuery({
    queryKey: ['customers', searchQuery, currentPage],
    queryFn: () => fetchCrmData('customers', searchQuery, currentPage),
  });
};

export const useSocieties = () => {
  const { searchQuery, currentPage } = useDashboardStore();
  return useQuery({
    queryKey: ['societies', searchQuery, currentPage],
    queryFn: () => fetchCrmData('societies', searchQuery, currentPage),
  });
};

export const useCreateSociety = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; city: string; delivery_radius_km?: number; is_active?: boolean }) => {
      const { data } = await apiClient.post('/societies', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });
};

export const useUpdateSociety = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; city?: string; delivery_radius_km?: number; is_active?: boolean }) => {
      const { data } = await apiClient.put(`/societies/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });
};

export const useDeliveryPartners = () => {
  const { searchQuery, currentPage } = useDashboardStore();
  return useQuery({
    queryKey: ['delivery-partners', searchQuery, currentPage],
    queryFn: () => fetchCrmData('delivery-partners', searchQuery, currentPage),
  });
};

export const useComplaints = () => {
  const { searchQuery, currentPage } = useDashboardStore();
  return useQuery({
    queryKey: ['complaints', searchQuery, currentPage],
    queryFn: async () => {
      const { data } = await apiClient.get(`/crm/complaints?query=${searchQuery}&page=${currentPage}&limit=20`);
      return data.data;
    }
  });
};

// Mutation for updating status
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type, status, reason }: { id: string; type: 'chefs' | 'customers'; status: string; reason: string }) => {
      await apiClient.patch(`/crm/${type}/${id}/status`, { status, reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.type] });
    }
  });
};

export const useVerifications = () => {
  return useQuery({
    queryKey: ['verifications'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/crm/verification`);
      return data.data;
    },
  });
};

export const useUpdateVerificationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'APPROVED' | 'REJECTED'; notes: string }) => {
      await apiClient.patch(`/crm/verification/${id}/status`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['chefs'] });
    }
  });
};

export interface OrderFilterState {
  query?: string;
  status?: string;
  paymentStatus?: string;
  settlementStatus?: string;
  paymentMethod?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
}

export const useGlobalOrders = (filters?: OrderFilterState) => {
  const { searchQuery } = useDashboardStore();
  const queryStr = filters?.query !== undefined ? filters.query : searchQuery;

  return useQuery({
    queryKey: ['orders', queryStr, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryStr) params.append('query', queryStr);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.paymentStatus) params.append('payment_status', filters.paymentStatus);
      if (filters?.settlementStatus) params.append('settlement_status', filters.settlementStatus);
      if (filters?.paymentMethod) params.append('payment_method', filters.paymentMethod);
      if (filters?.range) params.append('range', filters.range);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      params.append('limit', '100');

      const { data } = await apiClient.get(`/crm/orders?${params.toString()}`);
      return data.data;
    },
    refetchInterval: 5000,
  });
};

export const useOrderFinancialDetails = (orderId: string | null) => {
  return useQuery({
    queryKey: ['order_financial_details', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await apiClient.get(`/crm/orders/${orderId}/financial-details`);
      return data.data;
    },
    enabled: !!orderId,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason: string }) => {
      await apiClient.patch(`/crm/orders/${id}/status`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
};

export const useUpdateOrderPaymentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payment_status }: { id: string; payment_status: string }) => {
      await apiClient.patch(`/crm/orders/${id}/payment-status`, { payment_status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order_financial_details'] });
    }
  });
};

export const useUpdateOrderSettlementStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, settlement_status }: { id: string; settlement_status: string }) => {
      await apiClient.patch(`/crm/orders/${id}/settlement-status`, { settlement_status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order_financial_details'] });
    }
  });
};

export const useTickets = () => {
  const { searchQuery } = useDashboardStore();
  return useQuery({
    queryKey: ['tickets', searchQuery],
    queryFn: async () => {
      const { data } = await apiClient.get(`/crm/tickets?query=${searchQuery}&limit=100`);
      return data.data;
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/crm/tickets/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });
};

export const useChefProfile = (chefId: string | undefined) => {
  return useQuery({
    queryKey: ['chef_profile', chefId],
    queryFn: async () => {
      if (!chefId) return null;
      const { data } = await apiClient.get(`/crm/chefs/${chefId}`);
      return data.data;
    },
    enabled: !!chefId,
  });
};

export const useCustomerProfile = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['customer_profile', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const { data } = await apiClient.get(`/crm/customers/${customerId}`);
      return data.data;
    },
    enabled: !!customerId,
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: async (payload: { id?: string; user_id?: string; password?: string; newPassword?: string }) => {
      const targetId = payload.id || payload.user_id;
      const targetPass = payload.password || payload.newPassword;
      await apiClient.post(`/crm/profiles/${targetId}/reset-password`, { password: targetPass });
    }
  });
};

export const useSendNotification = () => {
  return useMutation({
    mutationFn: async ({ profile_id, title, message, type }: { profile_id: string; title: string; message: string; type?: string }) => {
      await apiClient.post('/crm/send-notification', { profile_id, title, message, type });
    }
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data } = await apiClient.patch(`/crm/profiles/${id}`, updates);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer_profile', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['chef_profile'] });
    }
  });
};

export const useUpdateKitchen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data } = await apiClient.patch(`/crm/kitchens/${id}`, updates);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chef_profile'] });
    }
  });
};

// Party Mode queries
export const usePartyBookings = () => {
  return useQuery({
    queryKey: ['party_bookings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/party/bookings');
      return data.data;
    }
  });
};

export const usePartyBookingById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['party_booking', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/party/bookings/${id}`);
      return data.data;
    },
    enabled: !!id
  });
};

export const useUpdatePartyBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { data } = await apiClient.patch(`/party/bookings/${id}/status`, { status, reason });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['party_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['party_booking', variables.id] });
    }
  });
};

export const useSavePartyMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kitchenId, menu }: { kitchenId: string; menu: any }) => {
      const { data } = await apiClient.put(`/party/menu/${kitchenId}`, menu);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chef_profile', variables.kitchenId] });
    }
  });
};
