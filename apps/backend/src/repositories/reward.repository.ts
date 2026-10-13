import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { rewardPoints, pointTransactions, referrals } from '../db/schema';
import { rowToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { RewardPoints, PointTransaction, Referral } from '../types/reward';

// reward_points/point_transactions/referrals never existed (confirmed absent
// from the live schema dump) despite GET /business/loyalty/rewards being
// live-routed and RewardService.addPoints firing on every completed order.
// getBalance's old "not found" fallback only caught PostgREST's no-rows
// code, not a missing-table error, so this always threw instead of
// returning a default. Created via supabase/local/009_reward_points_tables.sql.
export class RewardRepository {
  static async getBalance(profile_id: string): Promise<RewardPoints> {
    const rows = await db.select().from(rewardPoints).where(eq(rewardPoints.profileId, profile_id)).limit(1);
    if (!rows[0]) {
      return { profile_id, points_balance: 0, level: 'Bronze', total_earned: 0 };
    }
    return rowToSnakeCase<RewardPoints>(rows[0]);
  }

  static async updateBalance(profile_id: string, newBalance: number, newTotal: number, newLevel: string): Promise<void> {
    await db
      .insert(rewardPoints)
      .values({ profileId: profile_id, pointsBalance: newBalance, totalEarned: newTotal, level: newLevel })
      .onConflictDoUpdate({
        target: rewardPoints.profileId,
        set: { pointsBalance: newBalance, totalEarned: newTotal, level: newLevel },
      });
  }

  static async createTransaction(transaction: Omit<PointTransaction, 'id' | 'created_at'>): Promise<void> {
    await db.insert(pointTransactions).values(toCamelCaseInput(transaction) as any);
  }

  static async createReferral(referral: Omit<Referral, 'id' | 'created_at' | 'status'>): Promise<Referral> {
    const rows = await db
      .insert(referrals)
      .values({ ...(toCamelCaseInput(referral) as any), status: 'PENDING' })
      .returning();
    return rowToSnakeCase<Referral>(rows[0]);
  }
}
