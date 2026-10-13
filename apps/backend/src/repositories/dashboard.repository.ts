import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { orders, profiles, kitchens, settlements, societies, refunds } from '../db/schema';
import {
  DashboardStats,
  FinanceSummaryData,
  RevenueAnalyticsPoint,
  OrdersSummaryData,
  PaymentSummaryData,
  SettlementsSummaryData,
  TopChefData,
  TopSocietyData,
  FinancialActivityItem,
  PerformanceMetricsData,
} from '../types/dashboard';

const CANCELLED_STATUSES = ['CANCELLED', 'REJECTED'];

function pctChange(current: number, previous: number): number {
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function previousPeriod(startDate: string, endDate: string): { start: string; end: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
}

async function countRows(table: any, condition?: any): Promise<number> {
  const rows = condition
    ? await db.select({ count: sql<number>`count(*)` }).from(table).where(condition)
    : await db.select({ count: sql<number>`count(*)` }).from(table);
  return Number(rows[0]?.count || 0);
}

/**
 * The largest file converted this session. Beyond the usual query-layer
 * translation, three real bugs confirmed against the live schema:
 * - getPaymentSummary/getRecentFinancialActivity/getPerformanceMetrics all
 *   queried `payments` — the same nonexistent table already found absent
 *   three times before (order.repository.ts, payment.repository.ts,
 *   analytics.repository.ts's getPaymentAnalytics). Rebuilt using the real
 *   orders.payment_status column; payment-method breakdowns left at zero
 *   since no payment-method column exists anywhere, same "leave at zero
 *   rather than fabricate" approach already used twice this session.
 * - getRecentFinancialActivity also sorted settlements by `updated_at`,
 *   which doesn't exist (confirmed when converting settlement.repository.ts
 *   — settlements has no such column at all) — this was inside a
 *   Promise.all, so the missing column would have failed the ENTIRE
 *   function, not just the settlements portion. Fixed to sort by
 *   created_at.
 * - getTopSocieties selected orders.profile_id, which doesn't exist (real:
 *   customer_id).
 */
export class DashboardRepository {
  static async getOverviewStats(): Promise<DashboardStats> {
    let consumerCount = 0;
    let totalKitchens = 0;
    let verifiedKitchens = 0;
    let unverifiedKitchens = 0;
    let todays_revenue = 0;
    let todayOrdersCount = 0;
    let recentOrders: any[] = [];
    let recentKitchens: any[] = [];
    let recentConsumers: any[] = [];

    try {
      consumerCount = await countRows(profiles, eq(profiles.role, 'consumer'));
    } catch (e) {}

    try {
      totalKitchens = await countRows(kitchens);
    } catch (e) {}

    try {
      verifiedKitchens = await countRows(kitchens, eq(kitchens.isVerified, true));
    } catch (e) {}

    try {
      unverifiedKitchens = await countRows(kitchens, eq(kitchens.isVerified, false));
    } catch (e) {}

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const rows = await db.select({ grandTotal: orders.grandTotal }).from(orders).where(gte(orders.createdAt, today.toISOString()));
      todayOrdersCount = rows.length;
      todays_revenue = rows.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
    } catch (e) {}

    try {
      recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);
    } catch (e) {}

    try {
      recentKitchens = await db
        .select({ id: kitchens.id, name: kitchens.name, specialty: kitchens.specialty, address: kitchens.address, isVerified: kitchens.isVerified, createdAt: kitchens.createdAt })
        .from(kitchens)
        .orderBy(desc(kitchens.createdAt))
        .limit(5);
    } catch (e) {}

    try {
      recentConsumers = await db
        .select({ id: profiles.id, phone: profiles.phone, name: profiles.name, role: profiles.role, createdAt: profiles.createdAt, status: profiles.status })
        .from(profiles)
        .where(eq(profiles.role, 'consumer'))
        .orderBy(desc(profiles.createdAt))
        .limit(5);
    } catch (e) {}

    return {
      total_users: consumerCount,
      total_chefs: totalKitchens,
      verified_chefs: verifiedKitchens,
      pending_verification: unverifiedKitchens,
      todays_orders: todayOrdersCount,
      todays_revenue,
      pending_refunds: 0,
      open_tickets: 0,
      open_complaints: 0,
      failed_payments: 0,
      suspended_users: 0,
      kitchen_approvals_today: 0,
      recent_activity: recentOrders,
      recent_kitchens: recentKitchens,
      recent_consumers: recentConsumers,
    };
  }

  static async getFinanceSummary(startDate: string, endDate: string): Promise<FinanceSummaryData> {
    try {
      const orderList = await db
        .select({ grandTotal: orders.grandTotal, platformCommission: orders.platformCommission, netChefEarnings: orders.netChefEarnings, status: orders.status, createdAt: orders.createdAt })
        .from(orders)
        .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

      const delivered = orderList.filter((o) => o.status === 'DELIVERED');
      const revenue = delivered.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);

      const prev = previousPeriod(startDate, endDate);
      const prevOrders = await db
        .select({ grandTotal: orders.grandTotal })
        .from(orders)
        .where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, prev.start), lte(orders.createdAt, prev.end)));
      const prevRevenue = prevOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);

      const totalOrders = orderList.length;
      const completedOrders = delivered.length;
      const cancelledOrders = orderList.filter((o) => CANCELLED_STATUSES.includes(o.status || '')).length;
      const pendingOrders = totalOrders - completedOrders - cancelledOrders;

      const netEarnings = delivered.reduce((acc, o) => acc + Number(o.netChefEarnings || 0), 0);

      const pendingList = await db
        .select({ netPayable: settlements.netPayable })
        .from(settlements)
        .where(inArray(settlements.status, ['PENDING', 'GENERATED', 'PROCESSING']));
      const pendingAmount = pendingList.reduce((acc, s) => acc + Number(s.netPayable || 0), 0);

      const paidSettlements = await db.select({ netPayable: settlements.netPayable }).from(settlements).where(eq(settlements.status, 'PAID'));
      const paidAmount = paidSettlements.reduce((acc, s) => acc + Number(s.netPayable || 0), 0);

      const now = new Date();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [todayOrders, weeklyOrders, monthlyOrders] = await Promise.all([
        db.select({ platformCommission: orders.platformCommission }).from(orders).where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, todayStart.toISOString()))),
        db.select({ platformCommission: orders.platformCommission }).from(orders).where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, weekAgo))),
        db.select({ platformCommission: orders.platformCommission }).from(orders).where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, monthAgo))),
      ]);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

      const [thisMonthOrders, lastMonthOrders] = await Promise.all([
        db.select({ grandTotal: orders.grandTotal }).from(orders).where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, monthStart))),
        db.select({ grandTotal: orders.grandTotal }).from(orders).where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, lastMonthStart), lte(orders.createdAt, lastMonthEnd))),
      ]);

      const thisMonthRevenue = thisMonthOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);
      const lastMonthRevenue = lastMonthOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);

      return {
        todays_revenue: { amount: revenue, growth_vs_yesterday: pctChange(revenue, prevRevenue) },
        todays_orders: { total: totalOrders, completed: completedOrders, pending: pendingOrders, cancelled: cancelledOrders },
        pending_chef_payouts: { pending_count: pendingList.length, pending_amount: pendingAmount },
        platform_commission: {
          today: todayOrders.reduce((acc, o) => acc + Number(o.platformCommission || 0), 0),
          weekly: weeklyOrders.reduce((acc, o) => acc + Number(o.platformCommission || 0), 0),
          monthly: monthlyOrders.reduce((acc, o) => acc + Number(o.platformCommission || 0), 0),
        },
        chef_earnings: { total: netEarnings, pending: pendingAmount, paid: paidAmount },
        monthly_revenue: { amount: thisMonthRevenue, monthly_growth: pctChange(thisMonthRevenue, lastMonthRevenue) },
      };
    } catch (e) {
      console.error('Error fetching finance summary:', e);
      return {
        todays_revenue: { amount: 0, growth_vs_yesterday: 0 },
        todays_orders: { total: 0, completed: 0, pending: 0, cancelled: 0 },
        pending_chef_payouts: { pending_count: 0, pending_amount: 0 },
        platform_commission: { today: 0, weekly: 0, monthly: 0 },
        chef_earnings: { total: 0, pending: 0, paid: 0 },
        monthly_revenue: { amount: 0, monthly_growth: 0 },
      };
    }
  }

  static async getRevenueAnalytics(startDate: string, endDate: string): Promise<RevenueAnalyticsPoint[]> {
    try {
      const rows = await db
        .select({ createdAt: orders.createdAt, grandTotal: orders.grandTotal, platformCommission: orders.platformCommission, netChefEarnings: orders.netChefEarnings })
        .from(orders)
        .where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
        .orderBy(orders.createdAt);

      const byDay = new Map<string, RevenueAnalyticsPoint>();
      rows.forEach((o) => {
        const day = (o.createdAt || '').split('T')[0];
        if (!byDay.has(day)) {
          byDay.set(day, { label: day, date: day, revenue: 0, platform_commission: 0, chef_earnings: 0 });
        }
        const point = byDay.get(day)!;
        point.revenue += Number(o.grandTotal || 0);
        point.platform_commission += Number(o.platformCommission || 0);
        point.chef_earnings += Number(o.netChefEarnings || 0);
      });

      return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (e) {
      console.error('Error fetching revenue analytics:', e);
      return [];
    }
  }

  static async getOrdersSummary(startDate: string, endDate: string): Promise<OrdersSummaryData> {
    try {
      const list = await db.select({ status: orders.status }).from(orders).where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

      const total = list.length;
      const completed = list.filter((o) => o.status === 'DELIVERED').length;
      const cancelled = list.filter((o) => CANCELLED_STATUSES.includes(o.status || '')).length;
      const pending = total - completed - cancelled;

      return {
        total_orders: total,
        completed_orders: completed,
        pending_orders: pending,
        cancelled_orders: cancelled,
        order_success_rate: total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 0,
      };
    } catch (e) {
      console.error('Error fetching orders summary:', e);
      return { total_orders: 0, completed_orders: 0, pending_orders: 0, cancelled_orders: 0, order_success_rate: 0 };
    }
  }

  static async getPaymentSummary(startDate: string, endDate: string): Promise<PaymentSummaryData> {
    try {
      const list = await db
        .select({ paymentStatus: orders.paymentStatus, grandTotal: orders.grandTotal, createdAt: orders.createdAt })
        .from(orders)
        .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

      const status = (p: (typeof list)[number]) => (p.paymentStatus || '').toLowerCase();
      const totals = {
        total: list.length,
        successful: list.filter((p) => ['paid', 'captured', 'success'].includes(status(p))).length,
        failed: list.filter((p) => status(p) === 'failed').length,
        pending: list.filter((p) => ['pending', 'authorized', 'initiated'].includes(status(p))).length,
        refunded: list.filter((p) => ['refunded', 'partially_refunded'].includes(status(p))).length,
      };

      // orders doesn't store a payment method at all — left at zero rather
      // than fabricated (same approach already used in
      // analytics.repository.ts's getPaymentAnalytics).
      const breakdown = { upi: 0, card: 0, net_banking: 0, wallet: 0, cod: 0 };

      return { totals, breakdown };
    } catch (e) {
      console.error('Error fetching payment summary:', e);
      return {
        totals: { total: 0, successful: 0, failed: 0, pending: 0, refunded: 0 },
        breakdown: { upi: 0, card: 0, net_banking: 0, wallet: 0, cod: 0 },
      };
    }
  }

  static async getSettlementsSummary(startDate: string, endDate: string): Promise<SettlementsSummaryData> {
    try {
      const list = await db
        .select({ status: settlements.status, netPayable: settlements.netPayable })
        .from(settlements)
        .where(and(gte(settlements.createdAt, startDate), lte(settlements.createdAt, endDate)));

      const bucket = (statuses: string[]) => list.filter((s) => statuses.includes(s.status));
      const pending = bucket(['PENDING', 'GENERATED']);
      const processing = bucket(['PROCESSING', 'APPROVED']);
      const paid = bucket(['PAID']);
      const failed = bucket(['FAILED', 'CANCELLED']);
      const sum = (items: typeof list) => items.reduce((acc, s) => acc + Number(s.netPayable || 0), 0);

      return {
        counts: { pending: pending.length, processing: processing.length, paid: paid.length, failed: failed.length },
        amounts: { pending: sum(pending), processing: sum(processing), paid: sum(paid), failed: sum(failed) },
      };
    } catch (e) {
      console.error('Error fetching settlements summary:', e);
      return {
        counts: { pending: 0, processing: 0, paid: 0, failed: 0 },
        amounts: { pending: 0, processing: 0, paid: 0, failed: 0 },
      };
    }
  }

  static async getTopChefs(limit: number, startDate: string, endDate: string): Promise<TopChefData[]> {
    try {
      const rows = await db
        .select({ order: orders, kitchen: kitchens })
        .from(orders)
        .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
        .where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

      const societyRows = await db.select({ id: societies.id, name: societies.name }).from(societies);
      const societyNameById = new Map(societyRows.map((s) => [s.id, s.name]));

      const grouped = new Map<string, TopChefData>();
      rows.forEach(({ order: o, kitchen }) => {
        if (!kitchen) return;
        const id = kitchen.id;
        if (!grouped.has(id)) {
          grouped.set(id, {
            chef_id: id,
            chef_name: kitchen.chefName || 'Chef',
            kitchen_name: kitchen.name || 'Kitchen',
            society_name: societyNameById.get(kitchen.societyId || '') || 'Unknown Society',
            orders_count: 0,
            total_revenue: 0,
            platform_commission: 0,
            net_earnings: 0,
          });
        }
        const item = grouped.get(id)!;
        item.orders_count += 1;
        item.total_revenue += Number(o.grandTotal || 0);
        item.platform_commission += Number(o.platformCommission || 0);
        item.net_earnings += Number(o.netChefEarnings || 0);
      });

      return Array.from(grouped.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);
    } catch (e) {
      console.error('Error fetching top chefs:', e);
      return [];
    }
  }

  static async getTopSocieties(limit: number, startDate: string, endDate: string): Promise<TopSocietyData[]> {
    try {
      const societyRows = await db.select({ id: societies.id, name: societies.name, city: societies.city }).from(societies);
      const orderRows = await db
        .select({ grandTotal: orders.grandTotal, customerId: orders.customerId, kitchenId: orders.kitchenId, kitchen: kitchens })
        .from(orders)
        .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
        .where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

      const grouped = new Map<string, { orders_count: number; revenue: number; customers: Set<string>; chefs: Set<string> }>();
      orderRows.forEach((o) => {
        const societyId = o.kitchen?.societyId;
        if (!societyId) return;
        if (!grouped.has(societyId)) {
          grouped.set(societyId, { orders_count: 0, revenue: 0, customers: new Set(), chefs: new Set() });
        }
        const item = grouped.get(societyId)!;
        item.orders_count += 1;
        item.revenue += Number(o.grandTotal || 0);
        if (o.customerId) item.customers.add(o.customerId);
        if (o.kitchenId) item.chefs.add(o.kitchenId);
      });

      return societyRows
        .map((s) => {
          const stats = grouped.get(s.id) || { orders_count: 0, revenue: 0, customers: new Set<string>(), chefs: new Set<string>() };
          return {
            society_id: s.id,
            society_name: s.name,
            city: s.city || '',
            orders_count: stats.orders_count,
            total_revenue: stats.revenue,
            active_customers: stats.customers.size,
            active_chefs: stats.chefs.size,
          };
        })
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);
    } catch (e) {
      console.error('Error fetching top societies:', e);
      return [];
    }
  }

  static async getRecentFinancialActivity(limit: number): Promise<FinancialActivityItem[]> {
    try {
      const [capturedOrders, settlementRows, refundRows] = await Promise.all([
        db
          .select({ id: orders.id, orderCode: orders.orderCode, grandTotal: orders.grandTotal, paymentStatus: orders.paymentStatus, customerId: orders.customerId, createdAt: orders.createdAt })
          .from(orders)
          .where(inArray(orders.paymentStatus, ['paid', 'captured', 'PAID', 'CAPTURED']))
          .orderBy(desc(orders.createdAt))
          .limit(limit),
        db
          .select({ id: settlements.id, kitchenId: settlements.kitchenId, netPayable: settlements.netPayable, status: settlements.status, createdAt: settlements.createdAt })
          .from(settlements)
          .orderBy(desc(settlements.createdAt))
          .limit(limit),
        db
          .select({ id: refunds.id, orderId: refunds.orderId, amount: refunds.amount, status: refunds.status, customerId: refunds.customerId, createdAt: refunds.createdAt })
          .from(refunds)
          .orderBy(desc(refunds.createdAt))
          .limit(limit),
      ]);

      const items: FinancialActivityItem[] = [];

      capturedOrders.forEach((p) => {
        items.push({
          id: p.id,
          event_type: 'CUSTOMER_PAYMENT',
          timestamp: p.createdAt,
          order_id: p.id,
          amount: Number(p.grandTotal || 0),
          status: p.paymentStatus,
          related_user: p.customerId,
          description: `Payment captured for order #${(p.id || '').substring(0, 8)}`,
        } as any);
      });

      settlementRows.forEach((s) => {
        items.push({
          id: s.id,
          event_type: s.status === 'PAID' ? 'SETTLEMENT_PAID' : 'SETTLEMENT_GENERATED',
          timestamp: s.createdAt,
          amount: Number(s.netPayable || 0),
          status: s.status,
          related_user: s.kitchenId,
          description: `Settlement ${String(s.status).toLowerCase()} for kitchen #${(s.kitchenId || '').substring(0, 8)}`,
        } as any);
      });

      refundRows.forEach((r) => {
        items.push({
          id: r.id,
          event_type: 'REFUND_ISSUED',
          timestamp: r.createdAt,
          order_id: r.orderId,
          amount: Number(r.amount || 0),
          status: r.status,
          related_user: r.customerId,
          description: `Refund issued for order #${(r.orderId || '').substring(0, 8)}`,
        } as any);
      });

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    } catch (e) {
      console.error('Error fetching recent financial activity:', e);
      return [];
    }
  }

  static async getPerformanceMetrics(startDate: string, endDate: string): Promise<PerformanceMetricsData> {
    try {
      const list = await db
        .select({ grandTotal: orders.grandTotal, netChefEarnings: orders.netChefEarnings, platformCommission: orders.platformCommission, status: orders.status, paymentStatus: orders.paymentStatus })
        .from(orders)
        .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

      const delivered = list.filter((o) => o.status === 'DELIVERED');
      const avg = (items: typeof list, field: 'grandTotal' | 'netChefEarnings' | 'platformCommission') =>
        items.length > 0 ? items.reduce((acc, o) => acc + Number(o[field] || 0), 0) / items.length : 0;

      const capturedPayments = list.filter((o) => ['paid', 'captured'].includes((o.paymentStatus || '').toLowerCase())).length;

      const settlementList = await db
        .select({ status: settlements.status })
        .from(settlements)
        .where(and(gte(settlements.createdAt, startDate), lte(settlements.createdAt, endDate)));
      const paidSettlements = settlementList.filter((s) => s.status === 'PAID').length;

      return {
        avg_order_value: avg(delivered, 'grandTotal'),
        avg_chef_earnings: avg(delivered, 'netChefEarnings'),
        avg_commission: avg(delivered, 'platformCommission'),
        order_success_rate: list.length > 0 ? Number(((delivered.length / list.length) * 100).toFixed(2)) : 0,
        payment_success_rate: list.length > 0 ? Number(((capturedPayments / list.length) * 100).toFixed(2)) : 0,
        settlement_success_rate: settlementList.length > 0 ? Number(((paidSettlements / settlementList.length) * 100).toFixed(2)) : 0,
      };
    } catch (e) {
      console.error('Error fetching performance metrics:', e);
      return {
        avg_order_value: 0,
        avg_chef_earnings: 0,
        avg_commission: 0,
        order_success_rate: 0,
        payment_success_rate: 0,
        settlement_success_rate: 0,
      };
    }
  }
}
