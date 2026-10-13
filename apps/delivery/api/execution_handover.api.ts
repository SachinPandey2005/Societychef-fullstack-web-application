import { apiClient } from './client';

export const executionHandoverApi = {
  confirmPickup: async (orderId: string, checklist: Record<string, boolean>): Promise<any> => {
    const response = await apiClient.post('/delivery/pickup', { order_id: orderId, checklist });
    return response.data?.data || response.data;
  },

  verifyChefPin: async (orderId: string, pin: string): Promise<any> => {
    const response = await apiClient.post('/delivery/pickup/verify', { order_id: orderId, pin });
    return response.data?.data || response.data;
  },

  verifyCustomerOtp: async (orderId: string, otp: string): Promise<any> => {
    const response = await apiClient.post('/delivery/otp/verify', { order_id: orderId, otp });
    return response.data?.data || response.data;
  },

  submitProofOfDelivery: async (orderId: string, signatureData?: string, photoUrl?: string): Promise<any> => {
    const response = await apiClient.post('/delivery/proof', {
      order_id: orderId,
      signature_data: signatureData,
      photo_url: photoUrl,
    });
    return response.data?.data || response.data;
  },

  completeDelivery: async (
    orderId: string,
    otpVerified: boolean,
    latitude?: number,
    longitude?: number
  ): Promise<any> => {
    const response = await apiClient.post('/delivery/complete', {
      order_id: orderId,
      otp_verified: otpVerified,
      latitude,
      longitude,
    });
    return response.data?.data || response.data;
  },

  reportIssue: async (
    orderId: string,
    issueType: string,
    notes?: string,
    photos?: string[]
  ): Promise<any> => {
    const response = await apiClient.post('/delivery/issue', {
      order_id: orderId,
      issue_type: issueType,
      notes,
      photos,
    });
    return response.data?.data || response.data;
  },

  getDeliveryStatus: async (orderId: string): Promise<any> => {
    const response = await apiClient.get(`/delivery/status?order_id=${encodeURIComponent(orderId)}`);
    return response.data?.data || response.data;
  },
};

export default executionHandoverApi;
