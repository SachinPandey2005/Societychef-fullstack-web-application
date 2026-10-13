import { create } from 'zustand';
import { partnerApi } from '../api/partner.api';

interface KYCState {
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason: string | null;
  isLoading: boolean;
  error: string | null;

  loadKycStatus: () => Promise<void>;
  submitKyc: () => Promise<void>;
}

export const useKYCStore = create<KYCState>((set) => ({
  status: 'PENDING',
  rejectionReason: null,
  isLoading: false,
  error: null,

  loadKycStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await partnerApi.getKycStatus();
      set({
        status: data.kyc_status,
        rejectionReason: data.rejection_reason || null,
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to load KYC status' });
    } finally {
      set({ isLoading: false });
    }
  },

  submitKyc: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await partnerApi.submitKyc();
      set({
        status: data.kyc_status,
        rejectionReason: null,
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to submit KYC verification' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useKYCStore;
