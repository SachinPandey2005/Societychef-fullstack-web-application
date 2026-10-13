import { apiClient } from './client';

export interface PartnerProfileResponse {
  profile: {
    id: string;
    phone: string;
    email?: string;
    name?: string;
    role: string;
    status: string;
  };
  partner: {
    id: string;
    vehicle_type: string;
    status: string;
    gender?: string;
    date_of_birth?: string;
    blood_group?: string;
    preferred_language?: string;
    profile_photo_url?: string;
    permanent_address?: string;
    current_address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
    kyc_status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    rejection_reason?: string;
    progress_percentage: number;
  };
  documents: Array<{
    id: string;
    document_type: string;
    document_url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    expiry_date?: string;
    rejection_reason?: string;
  }>;
  vehicle?: {
    id: string;
    vehicle_type: string;
    vehicle_number: string;
    rc_url: string;
    insurance_url: string;
    puc_url?: string;
    photo_url?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejection_reason?: string;
  };
  bank?: {
    id: string;
    holder_name: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    upi_id?: string;
    cheque_url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejection_reason?: string;
  };
  emergencyContact?: {
    id: string;
    primary_name: string;
    primary_phone: string;
    primary_relationship: string;
    secondary_name?: string;
    secondary_phone?: string;
    secondary_relationship?: string;
  };
  society?: {
    id: string;
    society_id: string;
    tower_coverage: string[];
    delivery_radius_km: number;
    working_zone?: string;
    shift_timing_start?: string;
    shift_timing_end?: string;
    societies: {
      name: string;
      city: string;
      address: string;
    };
  };
}

export const partnerApi = {
  getProfile: async (): Promise<PartnerProfileResponse> => {
    const response = await apiClient.get<PartnerProfileResponse>('/partner/profile');
    return response.data;
  },

  updateProfile: async (payload: Partial<PartnerProfileResponse['partner']> & { name?: string; email?: string } & Partial<PartnerProfileResponse['emergencyContact']>): Promise<PartnerProfileResponse> => {
    const response = await apiClient.put<PartnerProfileResponse>('/partner/profile', payload);
    return response.data;
  },

  uploadDocument: async (documentType: string, documentUrl: string, expiryDate?: string): Promise<any> => {
    const response = await apiClient.post<any>('/partner/documents', {
      document_type: documentType,
      document_url: documentUrl,
      expiry_date: expiryDate,
    });
    return response.data;
  },

  updateVehicle: async (payload: {
    vehicle_type: 'BIKE' | 'SCOOTER' | 'CYCLE' | 'EV' | 'WALKING';
    vehicle_number: string;
    rc_url: string;
    insurance_url: string;
    puc_url?: string;
    photo_url?: string;
  }): Promise<any> => {
    const response = await apiClient.put<any>('/partner/vehicle', payload);
    return response.data;
  },

  updateBank: async (payload: {
    holder_name: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    upi_id?: string;
    cheque_url: string;
  }): Promise<any> => {
    const response = await apiClient.put<any>('/partner/bank', payload);
    return response.data;
  },

  getKycStatus: async (): Promise<any> => {
    const response = await apiClient.get<any>('/partner/kyc');
    return response.data;
  },

  uploadSelfie: async (documentUrl: string): Promise<any> => {
    const response = await apiClient.post<any>('/partner/selfie', { document_url: documentUrl });
    return response.data;
  },

  getSocietyAssignment: async (): Promise<PartnerProfileResponse['society']> => {
    const response = await apiClient.get<PartnerProfileResponse['society']>('/partner/society');
    return response.data;
  },

  submitKyc: async (): Promise<any> => {
    const response = await apiClient.post<any>('/partner/kyc/submit');
    return response.data;
  },
};

export default partnerApi;
