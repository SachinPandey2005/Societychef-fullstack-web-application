import { create } from 'zustand';

export type AvailabilityStateMode = 'OFFLINE' | 'ONLINE' | 'BUSY' | 'DELIVERING' | 'BREAK';

interface AvailabilityState {
  status: AvailabilityStateMode;
  isOnline: boolean;
  isUpdating: boolean;
  lastUpdated: Date | null;
  error: string | null;

  setStatus: (status: AvailabilityStateMode) => void;
  setIsUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  toggleOnline: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  status: 'ONLINE',
  isOnline: true,
  isUpdating: false,
  lastUpdated: new Date(),
  error: null,

  setStatus: (status: AvailabilityStateMode) => {
    const isOnline = status !== 'OFFLINE';
    set({
      status,
      isOnline,
      lastUpdated: new Date(),
      error: null,
    });
  },

  setIsUpdating: (isUpdating: boolean) => set({ isUpdating }),
  setError: (error: string | null) => set({ error }),

  toggleOnline: () => {
    const current = get().status;
    const nextStatus: AvailabilityStateMode = current === 'OFFLINE' ? 'ONLINE' : 'OFFLINE';
    get().setStatus(nextStatus);
  },
}));
