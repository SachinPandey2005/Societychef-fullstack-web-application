import { apiClient } from './client';

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'AT_PICKUP'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'REACHED_CUSTOMER'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export interface PartnerRegistration {
  id: string;
  vehicle_details: string;
  license_number: string;
  is_online: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
}

export interface AssignmentDetails {
  id: string;
  order_id: string;
  partner_id: string;
  status: DeliveryStatus;
  pickup_otp: string;
  delivery_otp: string;
  assigned_at?: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
}

export const deliveryApi = {
  registerPartner: async (vehicleDetails: string, licenseNumber: string): Promise<PartnerRegistration> => {
    const response = await apiClient.post<PartnerRegistration>('/delivery/register', {
      vehicle_details: vehicleDetails,
      license_number: licenseNumber,
    });
    return response.data;
  },

  toggleOnlineStatus: async (isOnline: boolean): Promise<PartnerRegistration> => {
    const response = await apiClient.patch<PartnerRegistration>('/delivery/status', {
      is_online: isOnline,
    });
    return response.data;
  },

  updateAssignmentStatus: async (
    assignmentId: string,
    status: DeliveryStatus,
    otp?: string
  ): Promise<AssignmentDetails> => {
    const response = await apiClient.patch<AssignmentDetails>(`/delivery/assignments/${assignmentId}/status`, {
      status,
      otp,
    });
    return response.data;
  },

  pushTrackingUpdate: async (assignmentId: string, lat: number, lng: number): Promise<void> => {
    await apiClient.post(`/delivery/assignments/${assignmentId}/tracking`, { lat, lng });
  },

  getAssignmentByOrder: async (orderId: string): Promise<AssignmentDetails> => {
    const response = await apiClient.get<AssignmentDetails>(`/delivery/orders/${orderId}`);
    return response.data;
  },
};

export default deliveryApi;
