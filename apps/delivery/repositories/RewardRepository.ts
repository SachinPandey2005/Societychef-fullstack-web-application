import { rewardsApi } from '../api/rewards.api';
import { useRewardStore } from '../store/useRewardStore';

export class RewardRepository {
  static async fetchRewards(): Promise<void> {
    const store = useRewardStore.getState();
    store.setLoading(true);
    try {
      const data = await rewardsApi.getRewards();
      if (data) {
        store.setRewardsData(data);
      }
    } catch (error: any) {
      console.warn('[RewardRepository] Fetch rewards error:', error.message);
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }

  static async redeemReward(rewardId: string): Promise<any> {
    const store = useRewardStore.getState();
    store.setRedeeming(true);
    try {
      const result = await rewardsApi.redeemReward(rewardId);
      if (result) {
        store.setPointsBalance(result.points_balance);
        store.addRedemption({
          id: result.redemption_id,
          code: result.code,
          status: 'ISSUED',
          redeemed_at: new Date().toISOString(),
          title: result.reward_title || 'Reward Catalog Item',
          reward_type: 'COUPON', // Default mapping
          points_cost: 0, // Server calculated
        });
        return result;
      }
    } catch (error: any) {
      console.warn('[RewardRepository] Redeem reward error:', error.message);
      store.setError(error.message);
      throw error;
    } finally {
      store.setRedeeming(false);
    }
  }
}

export default RewardRepository;
