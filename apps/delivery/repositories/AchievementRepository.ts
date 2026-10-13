import { gamificationApi } from '../api/gamification.api';
import { useAchievementStore } from '../store/useAchievementStore';

export class AchievementRepository {
  static async fetchAchievements(): Promise<void> {
    const store = useAchievementStore.getState();
    store.setLoading(true);
    try {
      const data = await gamificationApi.getAchievements();
      if (data) {
        store.setData(data);
      }
    } catch (error: any) {
      console.warn('[AchievementRepository] Fetch achievements warning:', error.message);
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }
}

export default AchievementRepository;
