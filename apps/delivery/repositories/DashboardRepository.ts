import { dashboardApi } from '../api/dashboard.api';
import { useDashboardStore } from '../store/useDashboardStore';

export class DashboardRepository {
  static async fetchOverview(): Promise<void> {
    const store = useDashboardStore.getState();
    store.setLoading(true);
    try {
      const data = await dashboardApi.getDashboardOverview();
      store.setDashboardData(data);
    } catch (error: any) {
      console.warn('[DashboardRepository] Failed to fetch overview, using local state:', error.message);
      store.setError(error.message || 'Failed to sync live dashboard data');
    } finally {
      store.setLoading(false);
    }
  }

  static async refreshOverview(): Promise<void> {
    const store = useDashboardStore.getState();
    store.setRefreshing(true);
    try {
      const data = await dashboardApi.getDashboardOverview();
      store.setDashboardData(data);
    } catch (error: any) {
      console.warn('[DashboardRepository] Refresh failed:', error.message);
    } finally {
      store.setRefreshing(false);
    }
  }
}

export default DashboardRepository;
