import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db/client';
import { orders, profiles, kitchens, settlements, societies, refunds, financialAdjustments } from '../db/schema';
import { rowToSnakeCase } from '../db/caseMapper';

// Every table here is real (orders, profiles, kitchens, settlements,
// societies, refunds, financial_adjustments) with real FKs — a clean
// query-layer conversion, no missing schema. Supabase's embedded-join
// shorthand replaced with explicit Drizzle leftJoins throughout. All
// try/catch-to-empty-result fallbacks preserved exactly as before.
export class ReportsRepository {
  static async getOrdersReport(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const conditions = [];
      if (startDate) conditions.push(gte(orders.createdAt, startDate));
      if (endDate) conditions.push(lte(orders.createdAt, endDate));

      const rows = await db
        .select({ order: orders, customer: profiles, kitchen: kitchens })
        .from(orders)
        .leftJoin(profiles, eq(orders.customerId, profiles.id))
        .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(orders.createdAt));

      return rows.map(({ order, customer, kitchen }) => ({
        ...rowToSnakeCase<any>(order),
        profiles: customer ? { name: customer.name, phone: customer.phone } : null,
        kitchens: kitchen ? { name: kitchen.name } : null,
      }));
    } catch (e) {
      console.error('Error fetching orders report:', e);
      return [];
    }
  }

  static async getRevenueReport(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const conditions = [eq(orders.status, 'DELIVERED')];
      if (startDate) conditions.push(gte(orders.createdAt, startDate));
      if (endDate) conditions.push(lte(orders.createdAt, endDate));

      const rows = await db
        .select({
          id: orders.id,
          createdAt: orders.createdAt,
          grandTotal: orders.grandTotal,
          platformCommission: orders.platformCommission,
          status: orders.status,
          kitchenId: orders.kitchenId,
          kitchen: kitchens,
        })
        .from(orders)
        .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt));

      return rows.map((r) => ({
        id: r.id,
        created_at: r.createdAt,
        grand_total: r.grandTotal,
        platform_commission: r.platformCommission,
        status: r.status,
        kitchen_id: r.kitchenId,
        kitchens: r.kitchen ? { name: r.kitchen.name } : null,
      }));
    } catch (e) {
      console.error('Error fetching revenue report:', e);
      return [];
    }
  }

  static async getChefEarningsReport(period: 'daily' | 'weekly' | 'monthly' = 'daily', filters?: any): Promise<any[]> {
    try {
      const conditions = [eq(orders.status, 'DELIVERED')];
      if (filters?.startDate) conditions.push(gte(orders.createdAt, filters.startDate));
      if (filters?.endDate) conditions.push(lte(orders.createdAt, filters.endDate));
      if (filters?.kitchenId) conditions.push(eq(orders.kitchenId, filters.kitchenId));

      const orderRows = await db
        .select({ order: orders, kitchen: kitchens })
        .from(orders)
        .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
        .where(and(...conditions));

      // Fetch settlements to map settlement status
      const settlementRows = await db
        .select({ id: settlements.id, kitchenId: settlements.kitchenId, status: settlements.status })
        .from(settlements);

      const settlementMap = new Map<string, any>();
      settlementRows.forEach((s) => {
        settlementMap.set(s.kitchenId, s);
      });

      // Group orders by kitchen
      const grouped = new Map<string, any>();

      orderRows.forEach(({ order: o, kitchen }) => {
        const kId = o.kitchenId;
        if (!kId) return;
        const kName = kitchen?.name || 'Kitchen';
        const cName = kitchen?.chefName || 'Chef';

        const gross = Number(o.grandTotal || 0);
        const commission = Number(o.platformCommission || gross * 0.15);
        const net = Number(o.netChefEarnings || gross - commission);

        if (!grouped.has(kId)) {
          const latestSettlement = settlementMap.get(kId);
          grouped.set(kId, {
            kitchen_id: kId,
            chef_name: cName,
            kitchen_name: kName,
            society_name: 'Green Valley Heights',
            orders_count: 0,
            gross_revenue: 0,
            platform_commission: 0,
            net_earnings: 0,
            settlement_id: latestSettlement?.id || null,
            settlement_status: latestSettlement?.status || 'PENDING',
          });
        }

        const item = grouped.get(kId);
        item.orders_count += 1;
        item.gross_revenue += gross;
        item.platform_commission += commission;
        item.net_earnings += net;
      });

      return Array.from(grouped.values()).sort((a, b) => b.gross_revenue - a.gross_revenue);
    } catch (e) {
      console.error('Error fetching chef earnings report:', e);
      return [];
    }
  }

  static async getChefEarningsOverview(kitchen_id: string): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const orderRows = await db
        .select({
          createdAt: orders.createdAt,
          grandTotal: orders.grandTotal,
          platformCommission: orders.platformCommission,
          netChefEarnings: orders.netChefEarnings,
        })
        .from(orders)
        .where(and(eq(orders.kitchenId, kitchen_id), eq(orders.status, 'DELIVERED')));

      const calculateMetrics = (orderList: typeof orderRows) => {
        const orders_count = orderList.length;
        const gross_revenue = orderList.reduce((acc, curr) => acc + Number(curr.grandTotal || 0), 0);
        const commission = orderList.reduce((acc, curr) => acc + Number(curr.platformCommission || (curr.grandTotal || 0) * 0.15), 0);
        const net_earnings = orderList.reduce(
          (acc, curr) => acc + Number(curr.netChefEarnings || (curr.grandTotal || 0) - (curr.platformCommission || 0)),
          0
        );
        return { orders_count, gross_revenue, commission, net_earnings };
      };

      const todayOrders = orderRows.filter((o) => o.createdAt?.startsWith(today));
      const weeklyOrders = orderRows.filter((o) => (o.createdAt || '') >= sevenDaysAgo);
      const monthlyOrders = orderRows.filter((o) => (o.createdAt || '') >= thirtyDaysAgo);

      const settlementRows = await db
        .select({ id: settlements.id, status: settlements.status, netPayable: settlements.netPayable, createdAt: settlements.createdAt })
        .from(settlements)
        .where(eq(settlements.kitchenId, kitchen_id))
        .orderBy(desc(settlements.createdAt));

      const pendingSettlement = settlementRows.find((s) => s.status !== 'PAID');
      const lastPaidSettlement = settlementRows.find((s) => s.status === 'PAID');

      return {
        today: calculateMetrics(todayOrders),
        weekly: calculateMetrics(weeklyOrders),
        monthly: calculateMetrics(monthlyOrders),
        lifetime: {
          ...calculateMetrics(orderRows),
          last_settlement_date: lastPaidSettlement?.createdAt || null,
          pending_settlement_amount: Number(pendingSettlement?.netPayable || 0),
        },
      };
    } catch (e) {
      console.error('Error fetching chef earnings overview:', e);
      return {
        today: { orders_count: 0, gross_revenue: 0, commission: 0, net_earnings: 0 },
        weekly: { orders_count: 0, gross_revenue: 0, commission: 0, net_earnings: 0 },
        monthly: { orders_count: 0, gross_revenue: 0, commission: 0, net_earnings: 0 },
        lifetime: { orders_count: 0, gross_revenue: 0, commission: 0, net_earnings: 0, last_settlement_date: null, pending_settlement_amount: 0 },
      };
    }
  }

  static async getChefOrders(kitchen_id: string, date?: string): Promise<any[]> {
    try {
      const conditions = [eq(orders.kitchenId, kitchen_id)];
      if (date) {
        conditions.push(gte(orders.createdAt, `${date}T00:00:00`));
        conditions.push(lte(orders.createdAt, `${date}T23:59:59`));
      }

      const rows = await db
        .select({ order: orders, customer: profiles })
        .from(orders)
        .leftJoin(profiles, eq(orders.customerId, profiles.id))
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt));

      return rows.map(({ order: o, customer }) => ({
        id: o.id,
        created_at: o.createdAt,
        customer_name: customer?.name || 'Customer',
        grand_total: Number(o.grandTotal || 0),
        platform_commission: Number(o.platformCommission || 0),
        net_chef_earnings: Number(o.netChefEarnings || (o.grandTotal || 0) - (o.platformCommission || 0)),
        status: o.status,
      }));
    } catch (e) {
      console.error('Error fetching chef orders:', e);
      return [];
    }
  }

  static async getExecutiveFinanceSummary(): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const orderList = await db
        .select({
          grandTotal: orders.grandTotal,
          platformCommission: orders.platformCommission,
          netChefEarnings: orders.netChefEarnings,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.status, 'DELIVERED'));

      const getMetrics = (items: typeof orderList) => {
        const gross = items.reduce((acc, curr) => acc + Number(curr.grandTotal || 0), 0);
        const commission = items.reduce((acc, curr) => acc + Number(curr.platformCommission || (curr.grandTotal || 0) * 0.15), 0);
        const net = items.reduce((acc, curr) => acc + Number(curr.netChefEarnings || (curr.grandTotal || 0) - (curr.platformCommission || 0)), 0);
        return { gross, commission, net };
      };

      const todayMetrics = getMetrics(orderList.filter((o) => o.createdAt?.startsWith(today)));
      const weeklyMetrics = getMetrics(orderList.filter((o) => (o.createdAt || '') >= sevenDaysAgo));
      const monthlyMetrics = getMetrics(orderList.filter((o) => (o.createdAt || '') >= thirtyDaysAgo));

      const settlementList = await db.select({ status: settlements.status, netPayable: settlements.netPayable }).from(settlements);

      const pendingSettlements = settlementList.filter((s) => s.status === 'PENDING' || s.status === 'GENERATED' || s.status === 'PROCESSING');
      const paidSettlements = settlementList.filter((s) => s.status === 'PAID');
      const failedSettlements = settlementList.filter((s) => s.status === 'FAILED');

      return {
        revenue: {
          today: todayMetrics.gross,
          weekly: weeklyMetrics.gross,
          monthly: monthlyMetrics.gross,
        },
        commission: {
          today: todayMetrics.commission,
          weekly: weeklyMetrics.commission,
          monthly: monthlyMetrics.commission,
        },
        chef_earnings: {
          pending: pendingSettlements.reduce((acc, curr) => acc + Number(curr.netPayable || 0), 0),
          paid: paidSettlements.reduce((acc, curr) => acc + Number(curr.netPayable || 0), 0),
          total: getMetrics(orderList).net,
        },
        settlements: {
          pending_count: pendingSettlements.length,
          paid_count: paidSettlements.length,
          failed_count: failedSettlements.length,
        },
      };
    } catch (e) {
      console.error('Error fetching executive finance summary:', e);
      return {
        revenue: { today: 0, weekly: 0, monthly: 0 },
        commission: { today: 0, weekly: 0, monthly: 0 },
        chef_earnings: { pending: 0, paid: 0, total: 0 },
        settlements: { pending_count: 0, paid_count: 0, failed_count: 0 },
      };
    }
  }

  static async getSocietyPerformanceReport(filters?: any): Promise<any[]> {
    try {
      const societyRows = await db.select({ id: societies.id, name: societies.name }).from(societies);
      const orderRows = await db
        .select({ id: orders.id, grandTotal: orders.grandTotal, customerId: orders.customerId, kitchenId: orders.kitchenId, kitchen: kitchens })
        .from(orders)
        .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
        .where(eq(orders.status, 'DELIVERED'));

      const grouped = new Map<string, { orders_count: number; revenue: number; customers: Set<string>; chefs: Set<string> }>();

      orderRows.forEach((o) => {
        const sId = o.kitchen?.societyId;
        if (!sId) return;
        if (!grouped.has(sId)) {
          grouped.set(sId, { orders_count: 0, revenue: 0, customers: new Set(), chefs: new Set() });
        }
        const item = grouped.get(sId)!;
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
            orders_count: stats.orders_count,
            revenue: stats.revenue,
            active_customers: stats.customers.size,
            active_chefs: stats.chefs.size,
            average_order_value: stats.orders_count > 0 ? stats.revenue / stats.orders_count : 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);
    } catch (e) {
      console.error('Error fetching society performance report:', e);
      return [];
    }
  }

  static async getRefundReport(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any> {
    try {
      const refundRows = await db
        .select({ refund: refunds, kitchen: kitchens, customer: profiles })
        .from(refunds)
        .leftJoin(kitchens, eq(refunds.kitchenId, kitchens.id))
        .leftJoin(profiles, eq(refunds.customerId, profiles.id));

      const adjList = await db.select().from(financialAdjustments);

      const totalRefunds = refundRows.reduce((acc, r) => acc + Number(r.refund.amount || 0), 0);
      const totalAdjustments = adjList.reduce((acc, a) => acc + Number(a.amount || 0), 0);

      return {
        period,
        summary: {
          total_refund_amount: totalRefunds,
          total_refund_count: refundRows.length,
          settlement_reversals: adjList.filter((a) => a.adjustmentType === 'SETTLEMENT_REVERSAL').length,
          total_chef_adjustments: totalAdjustments,
          net_revenue_impact: totalRefunds + totalAdjustments,
        },
        refunds: refundRows.map(({ refund: r, kitchen, customer }) => ({
          id: r.id,
          refund_code: r.refundCode || `REF-${r.id.substring(0, 6)}`,
          order_id: r.orderId,
          customer_name: customer?.name || 'Customer',
          chef_name: kitchen?.chefName || 'Chef',
          amount: Number(r.amount),
          type: r.type,
          reason: r.reason,
          status: r.status,
          created_at: r.createdAt,
        })),
        adjustments: adjList.map((a) => rowToSnakeCase<any>(a)),
      };
    } catch (e) {
      console.error('Error fetching refund report:', e);
      return {
        period,
        summary: { total_refund_amount: 0, total_refund_count: 0, settlement_reversals: 0, total_chef_adjustments: 0, net_revenue_impact: 0 },
        refunds: [],
        adjustments: [],
      };
    }
  }
}
