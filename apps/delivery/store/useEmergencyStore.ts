import { create } from 'zustand';

interface EmergencyState {
  isSosTriggered: boolean;
  sosCountdown: number;
  alarmId: string | null;
  isLoading: boolean;
  error: string | null;

  setSosTriggered: (triggered: boolean) => void;
  setCountdown: (countdown: number) => void;
  setAlarmId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
  isSosTriggered: false,
  sosCountdown: 0,
  alarmId: null,
  isLoading: false,
  error: null,

  setSosTriggered: (isSosTriggered) => set({ isSosTriggered }),
  setCountdown: (sosCountdown) => set({ sosCountdown }),
  setAlarmId: (alarmId) => set({ alarmId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default useEmergencyStore;
