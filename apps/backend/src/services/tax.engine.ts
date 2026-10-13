import { supabase } from '../config/supabase';

export interface TaxRule {
  percentage: number;
}

export class TaxEngine {
  static async getTaxRule(region = 'DEFAULT'): Promise<TaxRule> {
    const { data } = await supabase
      .from('tax_rules')
      .select('percentage')
      .eq('region', region)
      .eq('active', true)
      .single();

    if (data) return data;

    // Fallback
    return { percentage: 0 };
  }

  static calculateTax(amount: number, rule: TaxRule): number {
    return (amount * rule.percentage) / 100;
  }
}
