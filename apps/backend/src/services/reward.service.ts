import { RewardRepository } from '../repositories/reward.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';

export class RewardService {
  static init() {
    internalEventBus.on(EVENTS.ORDER_COMPLETED, async (order) => {
      logger.info(`Processing rewards for completed order ${order.id}`);
      try {
        // Simple logic: 1 point per 100 minor units (1 INR)
        const pointsToAward = Math.floor(order.grand_total / 100);
        await this.addPoints(order.profile_id, pointsToAward, 'EARN', order.id);
      } catch (err) {
        logger.error('Failed to process rewards for order', err);
      }
    });
  }

  static async getBalance(profile_id: string) {
    return RewardRepository.getBalance(profile_id);
  }

  static async addPoints(profile_id: string, amount: number, type: 'EARN' | 'REDEEM' | 'EXPIRE', source_id?: string) {
    const current = await RewardRepository.getBalance(profile_id);
    
    const newBalance = type === 'EARN' ? current.points_balance + amount : current.points_balance - amount;
    if (newBalance < 0) throw new Error('Insufficient points');

    const newTotal = type === 'EARN' ? current.total_earned + amount : current.total_earned;
    
    // Auto upgrade tier logic
    let newLevel = current.level;
    if (newTotal > 10000) newLevel = 'Platinum';
    else if (newTotal > 5000) newLevel = 'Gold';
    else if (newTotal > 1000) newLevel = 'Silver';

    await RewardRepository.updateBalance(profile_id, newBalance, newTotal, newLevel);
    
    await RewardRepository.createTransaction({
      profile_id,
      amount,
      type,
      source_id
    });

    return { newBalance, newLevel };
  }

  static async createReferral(referrer_id: string, referred_id: string) {
    return RewardRepository.createReferral({ referrer_id, referred_id, reward_amount: 500 });
  }
}

// Initialize listeners
RewardService.init();
