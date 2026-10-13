export type MembershipLevel = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface RewardPoints {
  profile_id: string;
  points_balance: number;
  level: MembershipLevel;
  total_earned: number;
}

export interface PointTransaction {
  id: string;
  profile_id: string;
  amount: number;
  type: 'EARN' | 'REDEEM' | 'EXPIRE';
  source_id?: string; // e.g. order_id, referral_id
  created_at?: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'PENDING' | 'COMPLETED';
  reward_amount: number;
  created_at?: string;
}
