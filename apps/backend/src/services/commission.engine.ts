import { supabase } from '../config/supabase';
import { CommissionCalculationResult } from '../types/commission';

export interface ResolvedCommissionRule {
  rule_id?: string;
  rule_name: string;
  rule_type: 'CHEF' | 'SOCIETY' | 'PROMOTIONAL' | 'DEFAULT';
  percentage: number;
  fixed_fee: number;
}

export class CommissionEngine {
  /**
   * Resolves commission rule applying strict priority order:
   * 1. Chef-specific rule (kitchen_id matches)
   * 2. Society-specific rule (society_id matches)
   * 3. Promotional rule (currently active)
   * 4. Default platform commission (fallback)
   */
  static async resolveCommissionRule(kitchenId: string, societyId?: string): Promise<ResolvedCommissionRule> {
    // 1. Priority 1: Chef-Specific Rule
    const { data: chefRule } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('kitchen_id', kitchenId)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (chefRule) {
      return {
        rule_id: chefRule.id,
        rule_name: chefRule.rule_name || `Chef-Specific Rule (${chefRule.percentage}%)`,
        rule_type: 'CHEF',
        percentage: Number(chefRule.percentage || 10),
        fixed_fee: Number(chefRule.fixed_fee || 0),
      };
    }

    // 2. Priority 2: Society-Specific Rule (if society_id provided)
    if (societyId) {
      const { data: socRule } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('society_id', societyId)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (socRule) {
        return {
          rule_id: socRule.id,
          rule_name: socRule.rule_name || `Society Rule (${socRule.percentage}%)`,
          rule_type: 'SOCIETY',
          percentage: Number(socRule.percentage || 10),
          fixed_fee: Number(socRule.fixed_fee || 0),
        };
      }
    }

    // 3. Priority 3: Global Active Rules (Default or Promotional)
    const { data: globalRules } = await supabase
      .from('commission_rules')
      .select('*')
      .is('kitchen_id', null)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (globalRules && globalRules.length > 0) {
      const promoRule = globalRules.find(r => r.rule_type === 'PROMOTIONAL');
      if (promoRule) {
        return {
          rule_id: promoRule.id,
          rule_name: promoRule.rule_name || `Promotional Rate (${promoRule.percentage}%)`,
          rule_type: 'PROMOTIONAL',
          percentage: Number(promoRule.percentage || 10),
          fixed_fee: Number(promoRule.fixed_fee || 0),
        };
      }

      const defaultRule = globalRules[0];
      return {
        rule_id: defaultRule.id,
        rule_name: defaultRule.rule_name || `Platform Standard Commission (${defaultRule.percentage}%)`,
        rule_type: 'DEFAULT',
        percentage: Number(defaultRule.percentage || 10),
        fixed_fee: Number(defaultRule.fixed_fee || 0),
      };
    }

    // 4. Fallback Default
    return {
      rule_name: 'Platform Default Commission (10%)',
      rule_type: 'DEFAULT',
      percentage: 10,
      fixed_fee: 0,
    };
  }

  /**
   * Sequence: Order Total -> Platform Commission (%) -> Commission Amount -> Taxes -> Delivery Charges -> Net Chef Earnings
   */
  static async calculateOrderFinancials(
    orderId: string,
    grandTotal: number,
    deliveryFee: number,
    kitchenId: string,
    societyId?: string
  ): Promise<CommissionCalculationResult> {
    const rule = await this.resolveCommissionRule(kitchenId, societyId);

    const commissionAmount = Number(((grandTotal * rule.percentage / 100) + rule.fixed_fee).toFixed(2));
    const taxAmount = Number((commissionAmount * 0.18).toFixed(2)); // 18% GST on Commission Amount
    const netChefEarnings = Number(Math.max(0, grandTotal - commissionAmount - taxAmount - deliveryFee).toFixed(2));

    return {
      order_id: orderId,
      order_total: grandTotal,
      rule_applied: rule,
      platform_commission: commissionAmount,
      tax_amount: taxAmount,
      delivery_fee: deliveryFee,
      net_chef_earnings: netChefEarnings,
    };
  }

  static async getCommissionRule(kitchenId: string, category?: string) {
    const res = await this.resolveCommissionRule(kitchenId);
    return { percentage: res.percentage, fixed_fee: res.fixed_fee };
  }

  static calculateCommission(amount: number, rule: { percentage: number; fixed_fee: number }) {
    const percentageFee = (amount * rule.percentage) / 100;
    return percentageFee + rule.fixed_fee;
  }
}
