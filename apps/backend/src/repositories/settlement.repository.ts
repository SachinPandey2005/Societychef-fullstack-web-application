import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '../db/client';
import { settlements, kitchens, societies, profiles, orders, financialAuditLogs } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import {
  Settlement,
  SettlementStatus,
  SettlementFilterParams,
  SettlementSummaryMetrics,
  SettlementDetailsResponse,
} from '../types/settlement';

/**
 * settlements is a real table, matched exactly. The three read methods that
 * embed kitchen info (getPendingSettlements/getSettlementsExtended/
 * getSettlementDetailsWithOrders) previously hardcoded the SAME fake phone,
 * email, and society name for every kitchen regardless of which one it
 * actually was — kitchens has no phone/email column, but the chef's own
 * profile (kitchens.chef_user_id -> profiles) does, and societies is a real,
 * joinable table kitchens.society_id already points at. Resolved for real
 * here instead of left as always-identical placeholders. The fake-fallback
 * datasets on error/empty (getSettlementsExtended's 3 mock settlements,
 * getSettlementSummaryMetrics' mock totals) are preserved exactly as before,
 * same precedent as DishRepository/SettingsRepository/DisputeRepository
 * earlier this session.
 */

async function enrichKitchen(kitchenId: string | null) {
  if (!kitchenId) return null;
  const rows = await db
    .select({ kitchen: kitchens, society: societies, chefProfile: profiles })
    .from(kitchens)
    .leftJoin(societies, eq(kitchens.societyId, societies.id))
    .leftJoin(profiles, eq(kitchens.chefUserId, profiles.id))
    .where(eq(kitchens.id, kitchenId))
    .limit(1);
  if (!rows[0]) return null;
  const { kitchen, society, chefProfile } = rows[0];
  return {
    ...rowToSnakeCase<any>(kitchen),
    phone: chefProfile?.phone || 'N/A',
    email: chefProfile?.email || 'N/A',
    societies: { id: society?.id || '', name: society?.name || 'Unassigned' },
  };
}

export class SettlementRepository {
  static async createSettlement(
    settlement: Omit<Settlement, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: SettlementStatus }
  ): Promise<Settlement> {
    const rows = await db
      .insert(settlements)
      .values({ ...(toCamelCaseInput(settlement) as any), status: settlement.status || 'PENDING' })
      .returning();
    return rowToSnakeCase<Settlement>(rows[0]);
  }

  static async findById(id: string): Promise<Settlement | null> {
    const rows = await db.select().from(settlements).where(eq(settlements.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<Settlement>(rows[0]) : null;
  }

  static async updateStatus(id: string, status: SettlementStatus): Promise<Settlement> {
    // settlements has no updated_at column at all (confirmed against the
    // real schema) — the original code set one anyway in the same .update()
    // call as status, which PostgREST maps 1:1 to real columns for UPDATE
    // just like SELECT, so this errored on every single call (not a silent
    // drop — that forgiving behavior is specific to Drizzle, and only
    // relevant to code converted after this point).
    const rows = await db.update(settlements).set({ status }).where(eq(settlements.id, id)).returning();
    return rowToSnakeCase<Settlement>(rows[0]);
  }

  static async getSettlementsByKitchen(kitchen_id: string): Promise<Settlement[]> {
    const rows = await db.select().from(settlements).where(eq(settlements.kitchenId, kitchen_id)).orderBy(desc(settlements.periodEnd));
    return rowsToSnakeCase<Settlement>(rows);
  }

  static async getPendingSettlements(): Promise<Settlement[]> {
    const rows = await db
      .select()
      .from(settlements)
      .where(inArray(settlements.status, ['PENDING', 'GENERATED', 'PROCESSING']))
      .orderBy(desc(settlements.createdAt));

    return Promise.all(
      rows.map(async (s) => {
        const mapped = rowToSnakeCase<any>(s);
        return { ...mapped, kitchens: await enrichKitchen(mapped.kitchen_id) };
      })
    ) as unknown as Promise<Settlement[]>;
  }

  static async getSettlementsExtended(params: SettlementFilterParams): Promise<Settlement[]> {
    try {
      const conditions = [];
      if (params.status && params.status !== 'all') conditions.push(eq(settlements.status, params.status.toUpperCase()));
      if (params.startDate) conditions.push(gte(settlements.periodStart, params.startDate));
      if (params.endDate) conditions.push(lte(settlements.periodEnd, params.endDate));

      const rows = await db
        .select()
        .from(settlements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(settlements.createdAt));

      if (rows.length > 0) {
        let result = await Promise.all(
          rows.map(async (s) => {
            const mapped = rowToSnakeCase<any>(s);
            return { ...mapped, orders_count: 1, kitchens: await enrichKitchen(mapped.kitchen_id) };
          })
        );

        if (params.query) {
          const q = params.query.toLowerCase();
          result = result.filter(
            (s: any) =>
              s.id?.toLowerCase().includes(q) ||
              s.kitchens?.name?.toLowerCase().includes(q) ||
              s.kitchens?.chef_name?.toLowerCase().includes(q) ||
              s.kitchens?.societies?.name?.toLowerCase().includes(q)
          );
        }

        return result as unknown as Settlement[];
      }
    } catch (e: any) {
      console.warn('[SettlementRepository] DB getSettlementsExtended warning:', e.message);
    }

    // Fallback Mock Settlements Dataset for resilience
    let fallback = [
      {
        id: 'settle-801',
        kitchen_id: 'ktch-201',
        period_start: '2026-08-01',
        period_end: '2026-08-07',
        gross_sales: 12500,
        total_sales: 12500,
        platform_commission: 1250,
        gateway_fees: 250,
        taxes: 625,
        refund_adjustments: 0,
        net_payable: 10375,
        net_payout: 10375,
        status: 'PAID',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        kitchens: {
          id: 'ktch-201',
          name: 'Amma’s Malabar Kitchen',
          chef_name: 'Anjali Nair',
          phone: '+919876543210',
          email: 'anjali@example.com',
          societies: { id: 'soc-1', name: 'Green Valley Heights' },
        },
      },
      {
        id: 'settle-802',
        kitchen_id: 'ktch-202',
        period_start: '2026-08-01',
        period_end: '2026-08-07',
        gross_sales: 8400,
        total_sales: 8400,
        platform_commission: 840,
        gateway_fees: 168,
        taxes: 420,
        refund_adjustments: 0,
        net_payable: 6972,
        net_payout: 6972,
        status: 'APPROVED',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        kitchens: {
          id: 'ktch-202',
          name: 'Punjabi Zaika Kitchen',
          chef_name: 'Harpreet Singh',
          phone: '+919123456789',
          email: 'harpreet@example.com',
          societies: { id: 'soc-2', name: 'Royal Palms Towers' },
        },
      },
      {
        id: 'settle-803',
        kitchen_id: 'ktch-203',
        period_start: '2026-08-08',
        period_end: '2026-08-14',
        gross_sales: 4600,
        total_sales: 4600,
        platform_commission: 460,
        gateway_fees: 92,
        taxes: 230,
        refund_adjustments: 0,
        net_payable: 3818,
        net_payout: 3818,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        kitchens: {
          id: 'ktch-203',
          name: 'Shree Krishna Kathiyawadi',
          chef_name: 'Rameshbhai Patel',
          phone: '+919988776655',
          email: 'ramesh@example.com',
          societies: { id: 'soc-3', name: 'Sunflower Residency' },
        },
      },
    ];

    if (params.status && params.status !== 'all') {
      fallback = fallback.filter((s) => s.status.toLowerCase() === params.status?.toLowerCase());
    }

    if (params.query) {
      const q = params.query.toLowerCase();
      fallback = fallback.filter(
        (s) => s.id.toLowerCase().includes(q) || s.kitchens.name.toLowerCase().includes(q) || s.kitchens.chef_name.toLowerCase().includes(q)
      );
    }

    return fallback as unknown as Settlement[];
  }

  static async getSettlementSummaryMetrics(): Promise<SettlementSummaryMetrics> {
    try {
      const rows = await db
        .select({
          status: settlements.status,
          totalSales: settlements.totalSales,
          platformCommission: settlements.platformCommission,
          netPayable: settlements.netPayable,
          periodEnd: settlements.periodEnd,
          createdAt: settlements.createdAt,
        })
        .from(settlements);

      if (rows.length > 0) {
        const metrics: SettlementSummaryMetrics = {
          pending: { count: 0, total_amount: 0 },
          processing: { count: 0, total_amount: 0 },
          paid: { count: 0, total_amount: 0 },
          failed: { count: 0, total_amount: 0 },
          total_chef_earnings: {
            gross_sales: 0,
            platform_commission: 0,
            net_payable: 0,
            last_settlement_date: undefined,
          },
        };

        let latestDate: string | undefined;

        rows.forEach((s) => {
          const netPayable = Number(s.netPayable || 0);
          const grossSales = Number(s.totalSales || 0);
          const comm = Number(s.platformCommission || 0);
          const st = (s.status || 'PENDING').toUpperCase();

          if (st === 'PENDING' || st === 'GENERATED') {
            metrics.pending.count += 1;
            metrics.pending.total_amount += netPayable;
          } else if (st === 'PROCESSING' || st === 'APPROVED') {
            metrics.processing.count += 1;
            metrics.processing.total_amount += netPayable;
          } else if (st === 'PAID' || st === 'COMPLETED') {
            metrics.paid.count += 1;
            metrics.paid.total_amount += netPayable;
          } else if (st === 'FAILED' || st === 'CANCELLED') {
            metrics.failed.count += 1;
            metrics.failed.total_amount += netPayable;
          }

          metrics.total_chef_earnings.gross_sales += grossSales;
          metrics.total_chef_earnings.platform_commission += comm;
          metrics.total_chef_earnings.net_payable += netPayable;

          const dateStr = s.periodEnd || s.createdAt;
          if (dateStr && (!latestDate || new Date(dateStr) > new Date(latestDate))) {
            latestDate = dateStr;
          }
        });

        metrics.total_chef_earnings.last_settlement_date = latestDate;
        return metrics;
      }
    } catch (e: any) {
      console.warn('[SettlementRepository] DB getSettlementSummaryMetrics warning:', e.message);
    }

    return {
      pending: { count: 1, total_amount: 3818 },
      processing: { count: 1, total_amount: 6972 },
      paid: { count: 1, total_amount: 10375 },
      failed: { count: 0, total_amount: 0 },
      total_chef_earnings: {
        gross_sales: 25500,
        platform_commission: 2550,
        net_payable: 21165,
        last_settlement_date: new Date().toISOString(),
      },
    };
  }

  static async getSettlementDetailsWithOrders(id: string): Promise<SettlementDetailsResponse> {
    const settlementRows = await db.select().from(settlements).where(eq(settlements.id, id)).limit(1);
    if (!settlementRows[0]) {
      throw new Error(`Settlement #${id} not found`);
    }
    const settlement = rowToSnakeCase<any>(settlementRows[0]);
    const kitchen = await enrichKitchen(settlement.kitchen_id);

    // Query orders for this kitchen during settlement period
    const orderRows = await db
      .select({ order: orders, customer: profiles })
      .from(orders)
      .leftJoin(profiles, eq(orders.customerId, profiles.id))
      .where(
        and(
          eq(orders.kitchenId, settlement.kitchen_id),
          gte(orders.createdAt, settlement.period_start),
          lte(orders.createdAt, `${settlement.period_end}T23:59:59.999Z`)
        )
      );

    const formattedOrders = orderRows.map(({ order: o, customer }) => {
      const grandTotal = Number(o.grandTotal || o.itemTotal || 0);
      return {
        ...rowToSnakeCase<any>(o),
        grand_total: grandTotal,
        platform_commission: Number(o.platformCommission || grandTotal * 0.1),
        tax_amount: Number(o.taxAmount || 0),
        delivery_fee: Number(o.deliveryFee || 0),
        net_chef_earnings: Number(o.netChefEarnings || grandTotal * 0.9),
        customer_name: customer?.name || 'Customer',
      };
    });

    return {
      settlement: {
        ...settlement,
        orders_count: formattedOrders.length,
      },
      kitchen,
      orders: formattedOrders,
      financial_summary: {
        gross_sales: Number(settlement.total_sales || 0),
        platform_commission: Number(settlement.platform_commission || 0),
        taxes: Number(settlement.taxes || 0),
        delivery_fee: Number(formattedOrders.reduce((s, o) => s + o.delivery_fee, 0)),
        gateway_fees: Number(settlement.gateway_fees || 0),
        net_payable: Number(settlement.net_payable || 0),
      },
    } as unknown as SettlementDetailsResponse;
  }

  static async findSettlementByTransactionId(held_transaction_id: string): Promise<Settlement | null> {
    const rows = await db.select().from(settlements).where(eq(settlements.heldTransactionId, held_transaction_id)).limit(1);
    return rows[0] ? rowToSnakeCase<Settlement>(rows[0]) : null;
  }

  static async updateSettlementRecord(id: string, updates: Partial<Settlement>): Promise<Settlement> {
    const rows = await db
      .update(settlements)
      .set(toCamelCaseInput(updates) as any)
      .where(eq(settlements.id, id))
      .returning();
    return rowToSnakeCase<Settlement>(rows[0]);
  }

  static async bulkUpdateStatus(ids: string[], status: SettlementStatus, actor_id?: string): Promise<{ success: boolean; count: number }> {
    await db.update(settlements).set({ status }).where(inArray(settlements.id, ids));

    await this.logFinancialAudit({
      action: `BULK_UPDATE_SETTLEMENT_STATUS_${status}`,
      old_balance: 0,
      new_balance: ids.length,
    });

    return { success: true, count: ids.length };
  }

  static async logFinancialAudit(auditData: {
    wallet_id?: string;
    action: string;
    old_balance: number;
    new_balance: number;
  }): Promise<void> {
    try {
      await db.insert(financialAuditLogs).values({
        walletId: auditData.wallet_id,
        action: auditData.action,
        oldBalance: auditData.old_balance,
        newBalance: auditData.new_balance,
      });
    } catch (e) {
      console.warn('Failed to write financial audit log:', e);
    }
  }
}
