import { supportApi } from '../api/support.api';
import { useFAQStore } from '../store/useFAQStore';

export class FAQRepository {
  static async fetchFaqs(category?: string): Promise<void> {
    const store = useFAQStore.getState();
    store.setLoading(true);
    try {
      const items = await supportApi.getFaqs(category);
      if (items) {
        store.setFaqs(items);
      }
    } catch (e: any) {
      console.warn('[FAQRepository] Fetch FAQs error:', e.message);
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  }

  static search(query: string): void {
    const store = useFAQStore.getState();
    store.setSearchQuery(query);
  }
}

export default FAQRepository;
