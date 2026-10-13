import { create } from 'zustand';

export interface CustomerReview {
  id: string;
  order_id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_name: string;
}

export interface RatingsSummary {
  overall_rating: number;
  total_reviews: number;
  positive_feedback: {
    polite_behavior: string;
    package_intact: string;
    on_time: string;
  };
  negative_feedback: {
    late_delivery: string;
    unreachable: string;
  };
  suggestions: string[];
}

interface RatingState {
  summary: RatingsSummary | null;
  reviews: CustomerReview[];
  isLoading: boolean;
  error: string | null;

  setSummary: (summary: RatingsSummary) => void;
  setReviews: (reviews: CustomerReview[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRatingStore = create<RatingState>((set) => ({
  summary: null,
  reviews: [],
  isLoading: false,
  error: null,

  setSummary: (summary: RatingsSummary) => set({ summary, error: null }),
  setReviews: (reviews: CustomerReview[]) => set({ reviews, error: null }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

export default useRatingStore;
