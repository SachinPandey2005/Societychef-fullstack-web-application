import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1 point earned per ₹1 spent.  100 points = ₹10 off.
export const POINTS_PER_RUPEE   = 1;       // earn rate
export const RUPEES_PER_100PTS  = 10;      // redeem rate: 100 pts → ₹10
export const MIN_REDEEM_POINTS  = 50;      // minimum points needed to redeem

export function pointsToRupees(points: number): number {
  return Math.floor(points / 100) * RUPEES_PER_100PTS
       + Math.floor((points % 100) / 10); // partial: 10 pts = ₹1
}

// Simpler: 1 point = ₹0.10
export function pointsValue(points: number): number {
  return Math.floor(points * 0.1);
}

export function rupeesToPoints(rupees: number): number {
  return Math.round(rupees * POINTS_PER_RUPEE);
}

type RewardsState = {
  points: number;
  ordersCompleted: number;
  lifetimePoints: number;

  addPoints:    (pts: number) => void;
  spendPoints:  (pts: number) => void;
  completeOrder: () => void;
};

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set) => ({
      points: 0,
      ordersCompleted: 0,
      lifetimePoints: 0,

      addPoints: (pts) =>
        set((s) => ({ points: s.points + pts, lifetimePoints: s.lifetimePoints + pts })),

      spendPoints: (pts) =>
        set((s) => ({ points: Math.max(0, s.points - pts) })),

      completeOrder: () =>
        set((s) => ({ ordersCompleted: s.ordersCompleted + 1 })),
    }),
    {
      name: 'rasohi-rewards',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
