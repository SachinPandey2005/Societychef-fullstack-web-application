import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WeeklyDish, DayKey as DayOfWeek } from '../types';

export const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

export type { WeeklyDish, DayOfWeek };

export type PreBookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type PreBooking = {
  id: string;
  orderId: string;
  weeklyDishId: string;
  dishName: string;
  kitchenId: string;
  kitchenName: string;
  society: string;
  day: DayOfWeek;
  quantity: number;
  totalAmount: number;
  customerFlat: string;
  customerSociety: string;
  status: PreBookingStatus;
  createdAt: string;
};

type WeeklyState = {
  weeklyDishes: WeeklyDish[];
  preBookings: PreBooking[];

  publishWeeklyDish: (dish: Partial<WeeklyDish> & { kitchenId?: string; dishName: string; price: number; foodType: 'Veg' | 'NonVeg'; day: DayOfWeek; maxServings: number; prepTimeMinutes: number }) => void;
  updateWeeklyDish: (dish: WeeklyDish) => void;
  removeWeeklyDish: (id: string) => void;
  toggleDishActive: (id: string) => void;

  preBookDish: (booking: Omit<PreBooking, 'id' | 'createdAt' | 'status'>) => void;
  cancelPreBook: (id: string) => void;
  confirmPreBook: (id: string) => void;
};

export const useWeeklyStore = create<WeeklyState>()(
  persist(
    (set) => ({
      weeklyDishes: [],
      preBookings: [],

      publishWeeklyDish: (dish) =>
        set((s) => ({
          weeklyDishes: [
            ...s.weeklyDishes,
            {
              ...dish,
              id: dish.id || `wd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              category: dish.category || (dish.foodType === 'NonVeg' ? 'Non-Veg' : 'Veg'),
              foodType: dish.foodType || (dish.category === 'Non-Veg' ? 'NonVeg' : 'Veg'),
              mealType: dish.mealType || 'Lunch',
              maxServings: dish.maxServings || dish.quantity || 20,
              quantity: dish.quantity || dish.maxServings || 20,
              remainingQuantity: dish.remainingQuantity ?? dish.maxServings ?? dish.quantity ?? 20,
              remainingServings: dish.remainingServings ?? dish.maxServings ?? dish.quantity ?? 20,
              closeTime: dish.closeTime || '06:00 PM',
              status: dish.status || 'active',
              publishedAt: new Date().toISOString(),
              isActive: dish.isActive ?? true,
            },
          ],
        })),

      updateWeeklyDish: (dish) =>
        set((s) => ({
          weeklyDishes: s.weeklyDishes.map((d) => (d.id === dish.id ? dish : d)),
        })),

      removeWeeklyDish: (id) =>
        set((s) => ({
          weeklyDishes: s.weeklyDishes.filter((d) => d.id !== id),
        })),

      toggleDishActive: (id) =>
        set((s) => ({
          weeklyDishes: s.weeklyDishes.map((d) =>
            d.id === id ? { ...d, isActive: !d.isActive } : d,
          ),
        })),

      preBookDish: (booking) =>
        set((s) => {
          // Previously required the dish to already exist in this store's
          // own weeklyDishes array, which only ever gets populated in mock
          // mode. Real dishes are fetched separately (getWeeklyDishesForConsumer)
          // and never synced back here, so booking any real dish silently
          // no-op'd this whole action — no booking was ever recorded, even
          // though the caller already validated quantity against the real
          // remaining count and went on to show a success message regardless.
          return {
            preBookings: [
              ...s.preBookings,
              {
                ...booking,
                id: `pb-${Date.now()}`,
                status: 'pending',
                createdAt: new Date().toISOString(),
              },
            ],
            weeklyDishes: s.weeklyDishes.map((d) =>
              d.id === booking.weeklyDishId
                ? { ...d, remainingServings: Math.max(0, d.remainingServings - booking.quantity) }
                : d,
            ),
          };
        }),

      cancelPreBook: (id) =>
        set((s) => {
          const booking = s.preBookings.find((b) => b.id === id);
          if (!booking) return s;
          return {
            preBookings: s.preBookings.map((b) =>
              b.id === id ? { ...b, status: 'cancelled' } : b,
            ),
            weeklyDishes: s.weeklyDishes.map((d) =>
              d.id === booking.weeklyDishId
                ? { ...d, remainingServings: d.remainingServings + booking.quantity }
                : d,
            ),
          };
        }),

      confirmPreBook: (id) =>
        set((s) => ({
          preBookings: s.preBookings.map((b) =>
            b.id === id ? { ...b, status: 'confirmed' } : b,
          ),
        })),
    }),
    {
      name: 'rasohi-weekly',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
