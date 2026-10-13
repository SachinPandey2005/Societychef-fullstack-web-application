export type FraudActionType = 'LOG' | 'WARN' | 'REQUIRE_OTP' | 'HOLD_REFUND' | 'BLOCK_COUPON' | 'RESTRICT_WALLET' | 'FLAG_ACCOUNT' | 'ESCALATE_TO_OPS';

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  priority: number;
  conditions: any; // JSON representation of rule conditions
  actions: FraudActionType[];
  created_at?: string;
  updated_at?: string;
}

export interface TrustScore {
  id: string; // Same as profile_id
  score: number; // e.g. 0 to 100
  factors: Record<string, number>;
  updated_at?: string;
}

export interface FraudCase {
  id: string;
  target_id: string; // profile_id or order_id
  target_type: 'USER' | 'ORDER' | 'PAYMENT';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'FALSE_POSITIVE';
  triggered_rules: string[]; // Rule IDs
  ai_summary?: string;
  resolution_notes?: string;
  created_at?: string;
}

export interface FraudActivityLog {
  id: string;
  actor_id: string;
  action: string;
  details: Record<string, any>;
  created_at?: string;
}
