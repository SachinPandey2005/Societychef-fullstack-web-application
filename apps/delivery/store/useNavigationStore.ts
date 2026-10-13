import { create } from 'zustand';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface TurnStep {
  step: number;
  instruction: string;
  distance_meters: number;
}

export type RouteOptimizationType = 'FASTEST' | 'SHORTEST' | 'TRAFFIC_AWARE';

interface NavigationState {
  polyline: RouteCoordinate[];
  routeType: RouteOptimizationType;
  turnSteps: TurnStep[];
  currentStepIndex: number;
  distanceKm: number;
  durationMinutes: number;
  isRecalculating: boolean;
  
  setRoute: (polyline: RouteCoordinate[], distanceKm: number, durationMinutes: number, turnSteps?: TurnStep[]) => void;
  setRouteType: (type: RouteOptimizationType) => void;
  advanceTurnStep: () => void;
  setRecalculating: (recalculating: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  polyline: [
    { latitude: 19.1197, longitude: 72.9056 },
    { latitude: 19.1210, longitude: 72.9080 },
    { latitude: 19.1230, longitude: 72.9100 },
    { latitude: 19.1245, longitude: 72.9120 },
  ],
  routeType: 'FASTEST',
  turnSteps: [
    { step: 1, instruction: 'Head north on Central Avenue towards Gate 1', distance_meters: 400 },
    { step: 2, instruction: 'Turn right onto Green Meadows Main Road', distance_meters: 1200 },
    { step: 3, instruction: 'Arrive at Resident Tower B Entrance on the left', distance_meters: 800 },
  ],
  currentStepIndex: 0,
  distanceKm: 2.4,
  durationMinutes: 11,
  isRecalculating: false,

  setRoute: (polyline, distanceKm, durationMinutes, turnSteps) =>
    set((state) => ({
      polyline,
      distanceKm,
      durationMinutes,
      turnSteps: turnSteps || state.turnSteps,
      currentStepIndex: 0,
    })),

  setRouteType: (routeType) => set({ routeType }),

  advanceTurnStep: () =>
    set((state) => ({
      currentStepIndex: Math.min(state.turnSteps.length - 1, state.currentStepIndex + 1),
    })),

  setRecalculating: (isRecalculating) => set({ isRecalculating }),
}));
