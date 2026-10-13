import { performanceApi } from '../api/performance.api';
import { usePerformanceStore } from '../store/usePerformanceStore';

export class PerformanceRepository {
  static async fetchPerformance(): Promise<void> {
    const store = usePerformanceStore.getState();
    store.setLoading(true);
    try {
      const data = await performanceApi.getPerformance();
      if (data) {
        if (data.metrics) store.setMetrics(data.metrics);
        if (data.trends) store.setTrends(data.trends);
        if (data.penalties) store.setPenalties(data.penalties);
      }
    } catch (error: any) {
      console.warn('[PerformanceRepository] Fetch metrics warning:', error.message);
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }
}

export default PerformanceRepository;
