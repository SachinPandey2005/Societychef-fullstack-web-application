import { create } from 'zustand';
import { partnerApi, PartnerProfileResponse } from '../api/partner.api';

interface VehicleState {
  vehicle: PartnerProfileResponse['vehicle'] | null;
  isLoading: boolean;
  error: string | null;

  loadVehicle: () => Promise<void>;
  updateVehicle: (payload: {
    vehicle_type: 'BIKE' | 'SCOOTER' | 'CYCLE' | 'EV' | 'WALKING';
    vehicle_number: string;
    rc_url: string;
    insurance_url: string;
    puc_url?: string;
    photo_url?: string;
  }) => Promise<void>;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicle: null,
  isLoading: false,
  error: null,

  loadVehicle: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await partnerApi.getProfile();
      set({ vehicle: data.vehicle || null });
    } catch (e: any) {
      set({ error: e.message || 'Failed to load vehicle details' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateVehicle: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const vehicle = await partnerApi.updateVehicle(payload);
      set({ vehicle });
    } catch (e: any) {
      set({ error: e.message || 'Failed to update vehicle details' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useVehicleStore;
