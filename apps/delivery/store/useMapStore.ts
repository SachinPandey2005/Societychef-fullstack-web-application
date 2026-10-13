import { create } from 'zustand';

export type MapStyleType = 'LIGHT' | 'DARK' | 'SATELLITE';

interface MapState {
  mapStyle: MapStyleType;
  showTraffic: boolean;
  zoomLevel: number;
  recenterTriggerCount: number;

  setMapStyle: (style: MapStyleType) => void;
  toggleTraffic: () => void;
  setZoomLevel: (zoom: number) => void;
  triggerRecenter: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapStyle: 'DARK',
  showTraffic: true,
  zoomLevel: 16,
  recenterTriggerCount: 0,

  setMapStyle: (mapStyle) => set({ mapStyle }),
  toggleTraffic: () => set((state) => ({ showTraffic: !state.showTraffic })),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  triggerRecenter: () => set((state) => ({ recenterTriggerCount: state.recenterTriggerCount + 1 })),
}));
