import { create } from 'zustand';
import * as Location from 'expo-location';
import { navigationTrackingApi } from '../api/navigation_tracking.api';

export interface LocationTelemetry {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  altitude: number | null;
  battery_level: number;
  timestamp: string;
}

interface LocationState {
  currentLocation: LocationTelemetry | null;
  isStreaming: boolean;
  gpsStatus: 'HIGH_ACCURACY' | 'LOW_ACCURACY' | 'DISABLED' | 'PERMISSION_DENIED';
  batteryLevel: number;
  
  updateLocation: (telemetry: Partial<LocationTelemetry>) => Promise<void>;
  startStreaming: () => Promise<void>;
  stopStreaming: () => Promise<void>;
  setBatteryLevel: (level: number) => void;
  setGpsStatus: (status: LocationState['gpsStatus']) => void;
}

export const useLocationStore = create<LocationState>((set, get) => {
  let locationSubscription: Location.LocationSubscription | null = null;

  return {
    currentLocation: {
      latitude: 19.1197,
      longitude: 72.9056,
      heading: 45,
      speed: 15.5,
      accuracy: 5,
      altitude: 12,
      battery_level: 88,
      timestamp: new Date().toISOString(),
    },
    isStreaming: false,
    gpsStatus: 'HIGH_ACCURACY',
    batteryLevel: 88,

    updateLocation: async (telemetry) => {
      const existing = get().currentLocation;
      const updated: LocationTelemetry = {
        latitude: telemetry.latitude ?? existing?.latitude ?? 19.1197,
        longitude: telemetry.longitude ?? existing?.longitude ?? 72.9056,
        heading: telemetry.heading ?? existing?.heading ?? 0,
        speed: telemetry.speed ?? existing?.speed ?? 0,
        accuracy: telemetry.accuracy ?? existing?.accuracy ?? 5,
        altitude: telemetry.altitude ?? existing?.altitude ?? 0,
        battery_level: telemetry.battery_level ?? get().batteryLevel,
        timestamp: new Date().toISOString(),
      };

      set({ currentLocation: updated });

      // Post location telemetry to backend
      try {
        await navigationTrackingApi.updateLocation(updated);
      } catch (e) {
        console.warn('[LocationStore] Telemetry sync warning:', e);
      }
    },

    startStreaming: async () => {
      if (get().isStreaming) return;

      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') {
          set({ gpsStatus: 'PERMISSION_DENIED' });
          throw new Error('Foreground location permission denied');
        }

        // Adaptive location interval based on battery level
        const timeInterval = get().batteryLevel < 20 ? 15000 : 5000;

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval,
            distanceInterval: 5,
          },
          (location: Location.LocationObject) => {
            const { latitude, longitude, heading, speed, accuracy, altitude } = location.coords;
            get().updateLocation({
              latitude,
              longitude,
              heading,
              speed,
              accuracy,
              altitude,
            });
            set({ gpsStatus: 'HIGH_ACCURACY' });
          }
        );

        set({ isStreaming: true });
      } catch (e) {
        console.warn('[LocationStore] Start streaming fallback:', e);
        set({ isStreaming: false });
      }
    },

    stopStreaming: async () => {
      if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
      }
      set({ isStreaming: false });
    },

    setBatteryLevel: (batteryLevel: number) => set({ batteryLevel }),
    setGpsStatus: (gpsStatus) => set({ gpsStatus }),
  };
});

export default useLocationStore;
