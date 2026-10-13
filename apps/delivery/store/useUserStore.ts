import { create } from 'zustand';

export interface VehicleInfo {
  type: 'bicycle' | 'scooter' | 'motorcycle' | 'electric_scooter';
  plateNumber?: string;
  model: string;
}

export interface PartnerProfile {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  rating: number;
  completedOrdersCount: number;
  vehicle: VehicleInfo;
  societyHomeBase: string; // Hyperlocal central society
}

interface UserState {
  profile: PartnerProfile | null;
  isOnline: boolean;
  setProfile: (profile: PartnerProfile) => void;
  clearProfile: () => void;
  toggleOnline: () => void;
  setOnlineStatus: (status: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isOnline: false,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null, isOnline: false }),
  toggleOnline: () => set((state) => ({ isOnline: !state.isOnline })),
  setOnlineStatus: (status) => set({ isOnline: status }),
}));

export default useUserStore;
