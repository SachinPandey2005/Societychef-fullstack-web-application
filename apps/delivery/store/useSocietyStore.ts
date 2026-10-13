import { create } from 'zustand';
import { partnerApi, PartnerProfileResponse } from '../api/partner.api';

interface SocietyState {
  society: PartnerProfileResponse['society'] | null;
  isLoading: boolean;
  error: string | null;

  loadSocietyAssignment: () => Promise<void>;
}

export const useSocietyStore = create<SocietyState>((set) => ({
  society: null,
  isLoading: false,
  error: null,

  loadSocietyAssignment: async () => {
    set({ isLoading: true, error: null });
    try {
      const society = await partnerApi.getSocietyAssignment();
      set({ society });
    } catch (e: any) {
      set({ error: e.message || 'Failed to load society assignment' });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useSocietyStore;
