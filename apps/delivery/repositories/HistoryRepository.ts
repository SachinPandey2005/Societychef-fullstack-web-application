import { orderManagementApi } from '../api';
import { useHistoryStore } from '../store/useHistoryStore';

export class HistoryRepository {
  static async fetchHistory(): Promise<void> {
    const store = useHistoryStore.getState();
    store.setLoading(true);
    try {
      const data = await orderManagementApi.getOrderHistory(store.filters);
      store.setHistoryList(data || []);
    } catch (e: any) {
      console.warn('[HistoryRepository] Fetch history warning:', e.message);
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  }
}

export default HistoryRepository;
