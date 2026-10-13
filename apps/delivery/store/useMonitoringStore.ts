import { create } from 'zustand';

interface MonitoringState {
  apiLatency: number;
  realtimeConnected: boolean;
  gpsAvailable: boolean;
  storageAvailable: boolean;
  batteryOptimizationImpact: boolean;
  memoryUsage: number; // in MB
  isLoading: boolean;
  error: string | null;

  updateMetrics: (metrics: Partial<Omit<MonitoringState, 'isLoading' | 'error' | 'updateMetrics'>>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  apiLatency: 45, // in ms
  realtimeConnected: true,
  gpsAvailable: true,
  storageAvailable: true,
  batteryOptimizationImpact: false,
  memoryUsage: 82, // in MB
  isLoading: false,
  error: null,

  updateMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default useMonitoringStore;
