import { performanceApi } from '../api/performance.api';
import { useRatingStore } from '../store/useRatingStore';

export class RatingRepository {
  static async fetchRatingsSummary(): Promise<void> {
    const store = useRatingStore.getState();
    store.setLoading(true);
    try {
      const summary = await performanceApi.getRatingsSummary();
      if (summary) {
        store.setSummary(summary);
      }
    } catch (error: any) {
      console.warn('[RatingRepository] Fetch summary warning:', error.message);
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }

  static async fetchReviews(): Promise<void> {
    const store = useRatingStore.getState();
    store.setLoading(true);
    try {
      const reviews = await performanceApi.getReviews();
      if (reviews) {
        store.setReviews(reviews);
      }
    } catch (error: any) {
      console.warn('[RatingRepository] Fetch reviews warning:', error.message);
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }
}

export default RatingRepository;
