import { create } from 'zustand';
import { DeviceRecord } from '../api/devices.api';

interface DeviceState {
  devices: DeviceRecord[];
  isLoading: boolean;
  error: string | null;

  setDevices: (devices: DeviceRecord[]) => void;
  removeDevice: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  isLoading: false,
  error: null,

  setDevices: (devices) => set({ devices, error: null }),
  removeDevice: (id) => set((state) => ({ devices: state.devices.filter((d) => d.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default useDeviceStore;
