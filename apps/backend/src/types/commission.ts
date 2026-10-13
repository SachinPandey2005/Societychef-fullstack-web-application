export type CommissionRuleType = 'CHEF' | 'SOCIETY' | 'PROMOTIONAL' | 'DEFAULT';

export interface CommissionRule {
  id: string;
  rule_name?: string;
  rule_type: CommissionRuleType;
  kitchen_id?: string | null;
  society_id?: string | null;
  category?: string | null;
  percentage: number;
  fixed_fee: number;
  active: boolean;
  effective_date?: string | null;
  expiry_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateCommissionRuleInput = Omit<CommissionRule, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCommissionRuleInput = Partial<CreateCommissionRuleInput>;

export interface CommissionCalculationResult {
  order_id: string;
  order_total: number;
  rule_applied: {
    rule_id?: string;
    rule_name: string;
    rule_type: CommissionRuleType;
    percentage: number;
    fixed_fee: number;
  };
  platform_commission: number;
  tax_amount: number; // 18% GST on commission
  delivery_fee: number;
  net_chef_earnings: number;
}
