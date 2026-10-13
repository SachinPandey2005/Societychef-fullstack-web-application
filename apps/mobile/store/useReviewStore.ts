import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Review = {
  id: string;
  orderId: string;
  kitchenId: string;
  kitchenName: string;
  dishId: string;
  dishName: string;
  rating: number;       // 1–5
  comment: string;
  createdAt: string;
};

type ReviewState = {
  reviews: Review[];
  reviewedOrderIds: string[];   // prevent double-reviewing
  addReview: (r: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  editReview: (reviewId: string, rating: number, comment: string) => void;
  deleteReview: (reviewId: string) => void;
  loadReviewsForKitchen: (kitchenId: string) => Promise<void>;
};

const SEED: Review[] = [];

import {
  addReview as apiAddReview,
  deleteReview as apiDeleteReview,
  getReviewsForKitchen as apiGetReviewsForKitchen,
} from '../services';

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      reviews: SEED,
      reviewedOrderIds: [],

      addReview: async (r) => {
        const tempId = `temp-${Date.now()}`;
        const newReview = { ...r, id: tempId, createdAt: new Date().toISOString() };
        set((s) => ({
          reviews: [newReview, ...s.reviews],
          reviewedOrderIds: [...s.reviewedOrderIds, r.orderId],
        }));
        try {
          // Await (rather than fire-and-forget) so the temp local id can be
          // reconciled with the backend's real id — otherwise this review
          // would show twice once loadReviewsForKitchen re-fetches.
          const saved = await apiAddReview(r);
          set((s) => ({
            reviews: s.reviews.map((rv) => (rv.id === tempId ? (saved as Review) : rv)),
          }));
        } catch (err) {
          console.warn('Failed to sync review to backend:', err);
        }
      },

      loadReviewsForKitchen: async (kitchenId) => {
        try {
          const fetched = (await apiGetReviewsForKitchen(kitchenId)) as Review[];
          set((s) => ({
            reviews: [...fetched, ...s.reviews.filter((r) => r.kitchenId !== kitchenId)],
          }));
        } catch (err) {
          console.warn('Failed to load reviews for kitchen:', err);
        }
      },

      editReview: (reviewId, rating, comment) =>
        set((s) => ({
          reviews: s.reviews.map((r) =>
            r.id === reviewId ? { ...r, rating, comment, createdAt: new Date().toISOString() } : r
          ),
        })),

      deleteReview: (reviewId) => {
        set((s) => {
          const target = s.reviews.find((r) => r.id === reviewId);
          return {
            reviews: s.reviews.filter((r) => r.id !== reviewId),
            reviewedOrderIds: target
              ? s.reviewedOrderIds.filter((id) => id !== target.orderId)
              : s.reviewedOrderIds,
          };
        });
        // Fire-and-forget backend sync
        apiDeleteReview(reviewId).catch((err) => console.warn('Failed to delete review on backend:', err));
      },
    }),
    {
      name: 'rasohi-reviews',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function reviewsForKitchen(kitchenId: string, reviews: Review[]) {
  return reviews.filter((r) => r.kitchenId === kitchenId);
}

export function averageRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}
