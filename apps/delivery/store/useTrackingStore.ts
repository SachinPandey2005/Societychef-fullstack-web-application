import { create } from 'zustand';

export type GeofenceStatus = 'OUTSIDE_RADIUS' | 'APPROACHING_KITCHEN' | 'KITCHEN_ARRIVED' | 'APPROACHING_CUSTOMER' | 'CUSTOMER_ARRIVED';

interface TrackingState {
  isTrackingActive: boolean;
  sessionId: string | null;
  activeOrderId: string | null;
  geofenceStatus: GeofenceStatus;
  distanceToTargetMeters: number;

  startSession: (orderId: string, sessionId: string) => void;
  stopSession: () => void;
  setGeofenceStatus: (status: GeofenceStatus, distanceMeters?: number) => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  isTrackingActive: false,
  sessionId: null,
  activeOrderId: null,
  geofenceStatus: 'OUTSIDE_RADIUS',
  distanceToTargetMeters: 450,

  startSession: (orderId: string, sessionId: string) =>
    set({
      isTrackingActive: true,
      activeOrderId: orderId,
      sessionId,
    }),

  stopSession: () =>
    set({
      isTrackingActive: false,
      sessionId: null,
      activeOrderId: null,
      geofenceStatus: 'OUTSIDE_RADIUS',
    }),

  setGeofenceStatus: (geofenceStatus, distanceMeters = 0) =>
    set({
      geofenceStatus,
      distanceToTargetMeters: distanceMeters,
    }),
}));
