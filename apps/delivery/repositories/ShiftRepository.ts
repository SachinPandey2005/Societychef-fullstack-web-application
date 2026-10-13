import { dashboardApi } from '../api/dashboard.api';
import { useShiftStore } from '../store/useShiftStore';

export class ShiftRepository {
  static async fetchShift(): Promise<void> {
    const shiftStore = useShiftStore.getState();
    shiftStore.setLoading(true);
    try {
      const data = await dashboardApi.getShiftInfo();
      shiftStore.setShift(data);
    } catch (error: any) {
      console.warn('[ShiftRepository] Fetch shift warning:', error.message);
    } finally {
      shiftStore.setLoading(false);
    }
  }
}

export default ShiftRepository;
