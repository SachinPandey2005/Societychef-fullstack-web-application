import { create } from 'zustand';

interface SecurityState {
  biometricsAvailable: boolean;
  biometricsEnabled: boolean;
  failedAttempts: number;
  isLocked: boolean;
  lockoutTimeRemaining: number; // in seconds
  isLoading: boolean;
  error: string | null;

  setBiometricsAvailable: (available: boolean) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  lockAccount: (durationSeconds: number) => void;
  decrementLockoutTime: () => void;
  unlockAccount: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  biometricsAvailable: false,
  biometricsEnabled: false,
  failedAttempts: 0,
  isLocked: false,
  lockoutTimeRemaining: 0,
  isLoading: false,
  error: null,

  setBiometricsAvailable: (biometricsAvailable) => set({ biometricsAvailable }),
  setBiometricsEnabled: (biometricsEnabled) => set({ biometricsEnabled }),
  incrementFailedAttempts: () => {
    const nextAttempts = get().failedAttempts + 1;
    if (nextAttempts >= 5) {
      set({ failedAttempts: nextAttempts, isLocked: true, lockoutTimeRemaining: 60 });
    } else {
      set({ failedAttempts: nextAttempts });
    }
  },
  resetFailedAttempts: () => set({ failedAttempts: 0, isLocked: false, lockoutTimeRemaining: 0 }),
  lockAccount: (durationSeconds) => set({ isLocked: true, lockoutTimeRemaining: durationSeconds }),
  decrementLockoutTime: () => {
    const current = get().lockoutTimeRemaining;
    if (current <= 1) {
      set({ isLocked: false, lockoutTimeRemaining: 0, failedAttempts: 0 });
    } else {
      set({ lockoutTimeRemaining: current - 1 });
    }
  },
  unlockAccount: () => set({ isLocked: false, lockoutTimeRemaining: 0, failedAttempts: 0 }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default useSecurityStore;
