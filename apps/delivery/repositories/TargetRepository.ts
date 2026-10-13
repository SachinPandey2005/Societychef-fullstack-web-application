import { gamificationApi } from '../api/gamification.api';
import { useTargetStore } from '../store/useTargetStore';

export class TargetRepository {
  static async fetchTargetsAndIncentives(): Promise<void> {
    const store = useTargetStore.getState();
    store.setLoading(true);
    try {
      const [targets, incentives] = await Promise.all([
        gamificationApi.getTargets(),
        gamificationApi.getIncentives(),
      ]);
      
      if (targets) store.setTargets(targets);
      if (incentives) store.setIncentives(incentives);
    } catch (error: any) {
      console.warn('[TargetRepository] Fetch targets warning:', error.message);
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }
}

export default TargetRepository;
