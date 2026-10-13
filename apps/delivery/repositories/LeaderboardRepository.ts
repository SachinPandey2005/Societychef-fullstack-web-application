import { gamificationApi } from '../api/gamification.api';
import { useLeaderboardStore } from '../store/useLeaderboardStore';

export class LeaderboardRepository {
  static async fetchLeaderboard(scope?: 'SOCIETY' | 'CITY' | 'REGION' | 'COMPANY'): Promise<void> {
    const store = useLeaderboardStore.getState();
    const targetScope = scope || store.currentScope;
    store.setLoading(true);
    try {
      const entries = await gamificationApi.getLeaderboard(targetScope);
      if (entries) {
        store.setEntries(entries);
        store.setCurrentScope(targetScope);
      }
    } catch (error: any) {
      console.warn('[LeaderboardRepository] Fetch leaderboard warning:', error.message);
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }
}

export default LeaderboardRepository;
