export type RefundType = 'FULL' | 'PARTIAL' | 'MANUAL' | 'AUTOMATIC';

export type RefundStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED';

export interface RefundRecord {
  id: string;
  refund_code: string;
  order_id: string;
  customer_id?: string;
  kitchen_id?: string;
  payment_id?: string;
  amount: number;
  type: RefundType;
  reason: string;
  status: RefundStatus;
  requested_by?: string;
  approved_by?: string;
  processed_by?: string;
  refund_reference?: string;
  gateway_refund_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  customer_name?: string;
  chef_name?: string;
  kitchen_name?: string;
}

export interface RefundRequest {
  id: string;
  order_id: string;
  customer_id?: string;
  payment_id?: string;
  amount: number;
  reason: string;
  status: string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export type AdjustmentType =
  | 'COMMISSION_CORRECTION'
  | 'SETTLEMENT_CORRECTION'
  | 'WALLET_CORRECTION'
  | 'TAX_ADJUSTMENT'
  | 'DELIVERY_CHARGE_ADJUSTMENT'
  | 'MANUAL_ACCOUNTING_ENTRY'
  | 'REFUND_ADJUSTMENT'
  | 'SETTLEMENT_REVERSAL'
  | 'PENALTY'
  | 'CHARGEBACK'
  | 'BONUS'
  | 'INCENTIVE';

export interface FinancialAdjustment {
  id: string;
  adjustment_code: string;
  adjustment_type: AdjustmentType;
  target_type: 'CHEF' | 'CUSTOMER' | 'PLATFORM';
  target_id?: string;
  amount: number;
  entry_type: 'CREDIT' | 'DEBIT';
  reason: string;
  requested_by?: string;
  approved_by?: string;
  reference_entity_type?: string;
  reference_entity_id?: string;
  supporting_notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string;
}

export type DisputeCategory =
  | 'INCORRECT_CHARGE'
  | 'MISSING_REFUND'
  | 'DUPLICATE_PAYMENT'
  | 'WRONG_SETTLEMENT'
  | 'WRONG_COMMISSION'
  | 'FAILED_PAYOUT'
  | 'FRAUD_REVIEW';

export type DisputeStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface DisputeCase {
  id: string;
  dispute_code: string;
  order_id: string;
  customer_id?: string;
  kitchen_id?: string;
  category: DisputeCategory;
  status: DisputeStatus;
  priority: DisputePriority;
  assigned_agent_id?: string;
  description: string;
  resolution_notes?: string;
  resolution_time_minutes?: number;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  customer_name?: string;
  chef_name?: string;
  kitchen_name?: string;
  assigned_agent_name?: string;
}

export interface DisputeComment {
  id: string;
  dispute_id: string;
  author_id?: string;
  author_role?: string;
  comment: string;
  is_internal?: boolean;
  created_at?: string;
}
