import { supabase } from '../config/supabase';

export interface ReconciliationResult {
  total_checked: number;
  matched_count: number;
  mismatch_count: number;
  status: 'MATCHED' | 'REQUIRES_REVIEW' | 'FAILED';
  mismatches: Array<{
    type: 'MISSING_SETTLEMENT' | 'COMMISSION_MISMATCH' | 'PAYOUT_MISMATCH' | 'PAYMENT_UNVERIFIED';
    order_id: string;
    description: string;
    expected: number;
    actual: number;
  }>;
}

export class ReconciliationService {
  static async runPaymentReconciliation(): Promise<ReconciliationResult> {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, grand_total, platform_commission, net_chef_earnings, payment_status, status')
      .eq('status', 'DELIVERED');

    const orderList = orders || [];
    const { data: settlements } = await supabase.from('settlements').select('*');
    const { data: payouts } = await supabase.from('payout_requests').select('*');

    const settlementMap = new Map<string, any>();
    (settlements || []).forEach(s => {
      if (s.held_transaction_id) settlementMap.set(s.held_transaction_id, s);
    });

    const mismatches: ReconciliationResult['mismatches'] = [];
    let matchedCount = 0;

    for (const o of orderList) {
      const grandTotal = Number(o.grand_total || 0);
      const commission = Number(o.platform_commission || (grandTotal * 0.15));
      const expectedNet = grandTotal - commission;

      if (o.payment_status !== 'paid' && o.payment_status !== 'CAPTURED' && o.payment_status !== 'COMPLETED') {
        mismatches.push({
          type: 'PAYMENT_UNVERIFIED',
          order_id: o.id,
          description: `Order #${o.id.substring(0, 8)} delivered but payment status is ${o.payment_status}`,
          expected: grandTotal,
          actual: 0,
        });
      } else {
        matchedCount += 1;
      }
    }

    const totalChecked = orderList.length;
    const mismatchCount = mismatches.length;
    const status: ReconciliationResult['status'] = mismatchCount === 0 ? 'MATCHED' : mismatchCount < 5 ? 'REQUIRES_REVIEW' : 'FAILED';

    return {
      total_checked: totalChecked,
      matched_count: matchedCount,
      mismatch_count: mismatchCount,
      status,
      mismatches,
    };
  }

  static async getReconciliationSummary() {
    const result = await this.runPaymentReconciliation();
    return {
      last_run_at: new Date().toISOString(),
      health_score: result.total_checked > 0 ? (((result.matched_count / result.total_checked) * 100).toFixed(1) + '%') : '100%',
      ...result,
    };
  }
}
