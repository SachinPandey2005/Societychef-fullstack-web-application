import { db } from '../db/client';
import { settlements } from '../db/schema';
import { rowsToSnakeCase } from '../db/caseMapper';
import { FinanceOverview } from '../types/finance';

export class FinanceRepository {
  static async getFinanceOverview(): Promise<FinanceOverview> {
    // Highly simplified for architecture demonstration
    const rows = rowsToSnakeCase<any>(await db.select().from(settlements));

    let gross = 0;
    let platform = 0;
    let outstanding = 0;

    rows.forEach((s) => {
      gross += s.total_sales;
      platform += s.platform_commission;
      if (s.status === 'PENDING' || s.status === 'APPROVED') {
        outstanding += s.net_payable;
      }
    });

    return {
      gross_revenue: gross,
      platform_earnings: platform,
      outstanding_settlements: outstanding,
      pending_refunds: 0,
      taxes_collected: 0,
      payment_gateway_fees: 0,
    };
  }
}
