import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db/client';
import { orders, profiles, kitchens, societies, settlements, refunds } from '../db/schema';
import { AnalyticsOverview } from '../types/analytics';

/**
 * Several real bugs found converting this file, confirmed against the live
 * schema: orders has no society_id/total_amount/platform_fee/
 * commission_amount/consumer_user_id columns (real: kitchen_id via a join to
 * kitchens.society_id, item_total, platform_commission, customer_id) — every
 * one of getTopChefs/getTopKitchens/getRevenueAnalytics/getOverview's
 * society filter would have errored outright against the real database
 * (Supabase/PostgREST rejects selecting or filtering on an unknown column,
 * unlike Drizzle's forgiving behavior on insert/update). getPaymentAnalytics
 * targeted `payment_transactions`, a third nonexistent name for the same
 * payments concept already confirmed absent when converting
 * order.repository.ts/payment.repository.ts (the latter skipped entirely per
 * the Play Billing decision) — rebuilt here using the real
 * orders.payment_status column, the only actual payment-status source that
 * exists, with payment-method breakdown left at zero since orders doesn't
 * store a payment method at all (same "leave at zero rather than fabricate"
 * approach already used in this file's getRefundAnalytics).
 */
export class AnalyticsRepository {
  static async getOverview(start_date?: string, end_date?: string, society_id?: string): Promise<AnalyticsOverview> {
    const conditions = [];
    if (start_date) conditions.push(gte(orders.createdAt, start_date));
    if (end_date) conditions.push(lte(orders.createdAt, end_date));

    let orderRows: { grandTotal: number | null; status: string | null }[];
    if (society_id) {
      const rows = await db
        .select({ grandTotal: orders.grandTotal, status: orders.status })
        .from(orders)
        .innerJoin(kitchens, eq(orders.kitchenId, kitchens.id))
        .where(conditions.length > 0 ? and(eq(kitchens.societyId, society_id), ...conditions) : eq(kitchens.societyId, society_id));
      orderRows = rows;
    } else {
      orderRows = await db
        .select({ grandTotal: orders.grandTotal, status: orders.status })
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    }

    const total_orders = orderRows.length;
    const total_revenue = orderRows.filter((o) => o.status === 'DELIVERED').reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
    const cancellations = orderRows.filter((o) => o.status === 'REJECTED' || o.status === 'CANCELLED').length;

    const consumerRows = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.role, 'consumer'));
    const chefRows = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.role, 'chef'));

    return {
      total_revenue,
      total_orders,
      total_customers: consumerRows.length,
      total_chefs: chefRows.length,
      cancellation_rate: total_orders > 0 ? (cancellations / total_orders) * 100 : 0,
      refund_rate: 0,
      average_order_value: total_orders > 0 ? total_revenue / total_orders : 0,
      repeat_customer_rate: 0,
    };
  }

  static async getTopChefs(limit: number = 10, sort_by: string = 'revenue'): Promise<any[]> {
    const rows = await db
      .select({ order: orders, kitchen: kitchens })
      .from(orders)
      .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
      .where(eq(orders.status, 'DELIVERED'));

    const grouped = new Map<string, any>();

    rows.forEach(({ order: o, kitchen }) => {
      const kId = o.kitchenId;
      if (!kId) return;
      const kName = kitchen?.name || 'Kitchen';
      const cName = kitchen?.chefName || 'Chef';
      const img = kitchen?.profileImage;

      const gross = Number(o.grandTotal || 0);
      const commission = Number(o.platformCommission || gross * 0.15);
      const net = Number(o.netChefEarnings || gross - commission);

      if (!grouped.has(kId)) {
        grouped.set(kId, {
          kitchen_id: kId,
          chef_name: cName,
          kitchen_name: kName,
          profile_image: img,
          orders_count: 0,
          gross_revenue: 0,
          platform_commission: 0,
          net_earnings: 0,
        });
      }

      const item = grouped.get(kId);
      item.orders_count += 1;
      item.gross_revenue += gross;
      item.platform_commission += commission;
      item.net_earnings += net;
    });

    const list = Array.from(grouped.values());
    if (sort_by === 'orders') {
      list.sort((a, b) => b.orders_count - a.orders_count);
    } else if (sort_by === 'net_earnings') {
      list.sort((a, b) => b.net_earnings - a.net_earnings);
    } else {
      list.sort((a, b) => b.gross_revenue - a.gross_revenue);
    }

    return list.slice(0, limit);
  }

  static async getTopKitchens(limit: number = 10, sort_by: string = 'revenue'): Promise<any[]> {
    const kitchenRows = await db
      .select({ kitchen: kitchens, society: societies })
      .from(kitchens)
      .leftJoin(societies, eq(kitchens.societyId, societies.id));

    const orderRows = await db
      .select({ kitchenId: orders.kitchenId, grandTotal: orders.grandTotal, customerId: orders.customerId })
      .from(orders)
      .where(eq(orders.status, 'DELIVERED'));

    const kitchenStats = new Map<string, { orders_count: number; gross_revenue: number; customers: Set<string> }>();

    orderRows.forEach((o) => {
      if (!o.kitchenId) return;
      if (!kitchenStats.has(o.kitchenId)) {
        kitchenStats.set(o.kitchenId, { orders_count: 0, gross_revenue: 0, customers: new Set() });
      }
      const item = kitchenStats.get(o.kitchenId)!;
      item.orders_count += 1;
      item.gross_revenue += Number(o.grandTotal || 0);
      if (o.customerId) item.customers.add(o.customerId);
    });

    const result = kitchenRows.map(({ kitchen: k, society }) => {
      const stats = kitchenStats.get(k.id) || { orders_count: 0, gross_revenue: 0, customers: new Set<string>() };
      return {
        id: k.id,
        name: k.name,
        chef_name: k.chefName,
        society_name: society?.name || 'N/A',
        orders_count: stats.orders_count,
        gross_revenue: stats.gross_revenue,
        active_customers: stats.customers.size,
        is_live: k.isLive,
      };
    });

    if (sort_by === 'orders') {
      result.sort((a, b) => b.orders_count - a.orders_count);
    } else if (sort_by === 'customers') {
      result.sort((a, b) => b.active_customers - a.active_customers);
    } else {
      result.sort((a, b) => b.gross_revenue - a.gross_revenue);
    }

    return result.slice(0, limit);
  }

  static async getRevenueAnalytics(): Promise<any> {
    const list = await db
      .select({
        grandTotal: orders.grandTotal,
        platformCommission: orders.platformCommission,
        taxAmount: orders.taxAmount,
        deliveryFee: orders.deliveryFee,
        netChefEarnings: orders.netChefEarnings,
      })
      .from(orders)
      .where(eq(orders.status, 'DELIVERED'));

    const gross_sales = list.reduce((acc, curr) => acc + Number(curr.grandTotal || 0), 0);
    const platform_commission = list.reduce((acc, curr) => acc + Number(curr.platformCommission || (curr.grandTotal || 0) * 0.15), 0);
    const taxes = list.reduce((acc, curr) => acc + Number(curr.taxAmount || 0), 0);
    const delivery_charges = list.reduce((acc, curr) => acc + Number(curr.deliveryFee || 0), 0);
    const net_chef_earnings = list.reduce((acc, curr) => acc + Number(curr.netChefEarnings || gross_sales - platform_commission), 0);

    return {
      gross_sales,
      platform_commission,
      taxes,
      delivery_charges,
      net_chef_earnings,
      food_sales: gross_sales - delivery_charges - taxes,
    };
  }

  static async getPaymentAnalytics(): Promise<any> {
    const rows = await db.select({ paymentStatus: orders.paymentStatus }).from(orders);

    const by_status = {
      captured: rows.filter((p) => ['paid', 'captured', 'success'].includes((p.paymentStatus || '').toLowerCase())).length,
      pending: rows.filter((p) => ['pending', 'initiated'].includes((p.paymentStatus || '').toLowerCase())).length,
      failed: rows.filter((p) => (p.paymentStatus || '').toLowerCase() === 'failed').length,
      refunded: rows.filter((p) => (p.paymentStatus || '').toLowerCase() === 'refunded').length,
    };

    // orders doesn't store a payment method at all — left at zero rather
    // than fabricated (same approach as getRefundAnalytics.by_payment_method
    // below).
    const by_method = { upi: 0, cards: 0, netbanking: 0, wallet: 0 };

    return { by_status, by_method, total_transactions: rows.length };
  }

  static async getSettlementAnalytics(): Promise<any> {
    const list = await db.select({ status: settlements.status, netPayable: settlements.netPayable }).from(settlements);

    const total_count = list.length;
    const pending_count = list.filter((s) => s.status === 'PENDING' || s.status === 'GENERATED' || s.status === 'PROCESSING').length;
    const paid_count = list.filter((s) => s.status === 'PAID').length;
    const failed_count = list.filter((s) => s.status === 'FAILED').length;

    const total_payout = list.reduce((acc, curr) => acc + Number(curr.netPayable || 0), 0);
    const avg_settlement_amount = total_count > 0 ? total_payout / total_count : 0;

    return {
      total_count,
      pending_count,
      paid_count,
      failed_count,
      total_payout,
      avg_settlement_amount,
      avg_processing_time_hours: 24,
    };
  }

  static async getRefundAnalytics(): Promise<any> {
    const refundRows = await db.select({ amount: refunds.amount, reason: refunds.reason, createdAt: refunds.createdAt }).from(refunds);
    const orderRows = await db.select({ grandTotal: orders.grandTotal, status: orders.status }).from(orders);

    const totalOrdersCount = orderRows.length || 1;
    const totalOrdersRevenue = orderRows.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0) || 1;
    const cancelledCount = orderRows.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length;

    const totalRefundAmount = refundRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const refundCount = refundRows.length;

    const refundPercentage = (totalRefundAmount / totalOrdersRevenue) * 100;
    const cancellationRate = (cancelledCount / totalOrdersCount) * 100;

    // Reason breakdown
    const reasonsMap = new Map<string, number>();
    refundRows.forEach((r) => {
      const reason = r.reason || 'General Cancellation';
      reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + Number(r.amount || 0));
    });

    const refund_reasons = Array.from(reasonsMap.entries()).map(([reason, amount]) => ({
      reason,
      amount,
      count: refundRows.filter((r) => (r.reason || 'General Cancellation') === reason).length,
    }));

    // Refunds bucketed by day-of-week from real created_at timestamps.
    const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = new Map<string, { amount: number; count: number }>();
    refundRows.forEach((r) => {
      if (!r.createdAt) return;
      const day = DAY_ORDER[new Date(r.createdAt).getDay()];
      const entry = trendMap.get(day) || { amount: 0, count: 0 };
      entry.amount += Number(r.amount || 0);
      entry.count += 1;
      trendMap.set(day, entry);
    });
    const trend = DAY_ORDER.map((day) => ({
      day,
      amount: trendMap.get(day)?.amount || 0,
      count: trendMap.get(day)?.count || 0,
    }));

    return {
      total_refund_amount: totalRefundAmount,
      total_refund_count: refundCount,
      refund_percentage: Number(refundPercentage.toFixed(2)),
      cancellation_rate: Number(cancellationRate.toFixed(2)),
      trend,
      reasons_breakdown: refund_reasons,
      // Payment-method breakdown needs a join to a payments table that
      // doesn't exist — left at zero rather than fabricated.
      by_payment_method: {
        upi: 0,
        card: 0,
        wallet: 0,
      },
    };
  }
}
