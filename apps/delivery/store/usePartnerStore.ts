import { create } from 'zustand';
import { partnerApi, PartnerProfileResponse } from '../api/partner.api';

interface PartnerState {
  profile: PartnerProfileResponse['profile'] | null;
  partner: PartnerProfileResponse['partner'] | null;
  documents: PartnerProfileResponse['documents'];
  isLoading: boolean;
  error: string | null;

  loadProfile: () => Promise<PartnerProfileResponse>;
  updateProfile: (payload: Partial<PartnerProfileResponse['partner']> & { name?: string; email?: string } & Partial<PartnerProfileResponse['emergencyContact']>) => Promise<void>;
}

export const usePartnerStore = create<PartnerState>((set) => ({
  profile: null,
  partner: null,
  documents: [],
  isLoading: false,
  error: null,

  loadProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await partnerApi.getProfile();
      set({ profile: data.profile, partner: data.partner, documents: data.documents || [] });
      return data;
    } catch (e: any) {
      set({ error: e.message || 'Failed to load partner profile' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await partnerApi.updateProfile(payload);
      set({ profile: data.profile, partner: data.partner, documents: data.documents || [] });
    } catch (e: any) {
      set({ error: e.message || 'Failed to update partner details' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default usePartnerStore;
