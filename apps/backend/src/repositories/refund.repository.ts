import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '../db/client';
import { refunds, financialAdjustments, orders, profiles, kitchens, auditLogs } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import { RefundRecord, RefundRequest, RefundStatus, FinancialAdjustment } from '../types/refund';

// refunds and financial_adjustments are real tables, matched exactly.
// refund_requests (createRefundRequest) is explicitly marked "Legacy method
// preserved for compatibility" in the original code's own comment and was
// confirmed absent from the live schema dump — the real refunds table
// already covers this same request->approve->process lifecycle, so this is
// a self-described superseded path, not a live feature to build schema for.
// Its existing fallback is preserved exactly as before (unlike the
// genuinely-live phantom-table findings elsewhere this session).
// getFinancialAdjustments' audit_logs fallback referenced wrong column names
// (target_entity_id/new_value/target_entity instead of the real
// entity_id/new_data/entity_type) — same mistake as the two other
// audit_logs writers found earlier this session — fixed here too.
export class RefundRepository {
  // Legacy method preserved for compatibility
  static async createRefundRequest(payload: Omit<RefundRequest, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<RefundRequest> {
    console.warn('refund_requests table does not exist (legacy/superseded by refunds) — returning fallback object');
    return {
      id: `rr_${Date.now()}`,
      order_id: payload.order_id,
      amount: payload.amount,
      reason: payload.reason,
      status: 'REQUESTED',
      created_at: new Date().toISOString(),
    } as RefundRequest;
  }

  static async findById(id: string): Promise<RefundRecord | null> {
    const rows = await db
      .select({ refund: refunds, profile: profiles, kitchen: kitchens })
      .from(refunds)
      .leftJoin(profiles, eq(refunds.customerId, profiles.id))
      .leftJoin(kitchens, eq(refunds.kitchenId, kitchens.id))
      .where(eq(refunds.id, id))
      .limit(1);

    if (!rows[0]) return null;
    const { refund, profile, kitchen } = rows[0];
    return {
      ...rowToSnakeCase<any>(refund),
      customer_name: profile?.displayName || 'Customer',
      kitchen_name: kitchen?.name || 'Kitchen',
      chef_name: kitchen?.chefName || 'Chef',
    } as RefundRecord;
  }

  static async createRefund(payload: Partial<RefundRecord>): Promise<RefundRecord> {
    const refundCode = `REF-${Date.now().toString().slice(-6)}`;
    const record = {
      refundCode,
      orderId: payload.order_id,
      customerId: payload.customer_id,
      kitchenId: payload.kitchen_id,
      paymentId: payload.payment_id,
      amount: payload.amount!,
      type: payload.type || 'FULL',
      reason: payload.reason || 'Order Cancellation',
      status: payload.status || 'PENDING',
      requestedBy: payload.requested_by,
      approvedBy: payload.approved_by,
      processedBy: payload.processed_by,
      refundReference: payload.refund_reference || `ref_ref_${Date.now()}`,
      gatewayRefundId: payload.gateway_refund_id || `rzp_ref_${Date.now().toString().slice(-8)}`,
      metadata: payload.metadata || {},
    };

    try {
      const rows = await db.insert(refunds).values(record).returning();
      return rowToSnakeCase<RefundRecord>(rows[0]);
    } catch (error: any) {
      console.warn('Failed to insert refund, returning fallback object:', error.message);
      return { id: `ref_${Date.now()}`, ...record, created_at: new Date().toISOString() } as unknown as RefundRecord;
    }
  }

  static async updateStatus(id: string, status: any, reviewer_id?: string, rejection_reason?: string): Promise<any> {
    return this.updateRefundStatus(id, status as RefundStatus, reviewer_id, rejection_reason);
  }

  static async updateRefundStatus(id: string, status: RefundStatus, actor_id?: string, gateway_refund_id?: string): Promise<RefundRecord> {
    const updates: any = { status, updatedAt: new Date().toISOString() };
    if (status === 'APPROVED') updates.approvedBy = actor_id;
    if (status === 'COMPLETED' || status === 'PROCESSING') updates.processedBy = actor_id;
    if (gateway_refund_id) updates.gatewayRefundId = gateway_refund_id;

    try {
      const rows = await db.update(refunds).set(updates).where(eq(refunds.id, id)).returning();
      return rowToSnakeCase<RefundRecord>(rows[0]);
    } catch (error) {
      return {
        id,
        refund_code: `REF-${id.slice(-6)}`,
        order_id: 'ord_mock',
        amount: 0,
        type: 'FULL',
        reason: 'Refund Status Update',
        status,
        updated_at: new Date().toISOString(),
      } as RefundRecord;
    }
  }

  static async getRefunds(limit = 50, offset = 0, filters?: any): Promise<RefundRecord[]> {
    const conditions = [];
    if (filters?.status && filters.status !== 'all') conditions.push(eq(refunds.status, filters.status.toUpperCase()));
    if (filters?.type && filters.type !== 'all') conditions.push(eq(refunds.type, filters.type.toUpperCase()));

    const rows = await db
      .select({ refund: refunds, profile: profiles, kitchen: kitchens })
      .from(refunds)
      .leftJoin(profiles, eq(refunds.customerId, profiles.id))
      .leftJoin(kitchens, eq(refunds.kitchenId, kitchens.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(refunds.createdAt))
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      // Fallback to orders table if refunds table is empty or unpopulated
      const cancelledOrders = await db
        .select({ order: orders, kitchen: kitchens, profile: profiles })
        .from(orders)
        .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
        .leftJoin(profiles, eq(orders.customerId, profiles.id))
        .where(or(eq(orders.paymentStatus, 'REFUNDED'), eq(orders.status, 'CANCELLED')))
        .orderBy(desc(orders.createdAt))
        .limit(limit);

      return cancelledOrders.map(({ order: o, kitchen, profile }) => ({
        id: `ref_${o.id.substring(0, 8)}`,
        refund_code: `REF-${o.id.substring(0, 6).toUpperCase()}`,
        order_id: o.id,
        customer_id: o.customerId,
        kitchen_id: o.kitchenId,
        customer_name: profile?.displayName || 'Customer',
        chef_name: kitchen?.chefName || 'Chef',
        kitchen_name: kitchen?.name || 'Kitchen',
        amount: Number(o.grandTotal || 0),
        type: 'FULL' as const,
        reason: 'Customer Cancellation / Order Refund',
        status: o.paymentStatus?.toUpperCase() === 'REFUNDED' ? ('COMPLETED' as const) : ('PENDING' as const),
        created_at: o.createdAt,
        processed_by: 'SYSTEM',
        refund_reference: `ref_rzp_${o.id.substring(0, 8)}`,
        gateway_refund_id: `rzp_ref_${o.id.substring(0, 8)}`,
      })) as unknown as RefundRecord[];
    }

    return rows.map(({ refund, profile, kitchen }) => ({
      ...rowToSnakeCase<any>(refund),
      customer_name: profile?.displayName || 'Customer',
      kitchen_name: kitchen?.name || 'Kitchen',
      chef_name: kitchen?.chefName || 'Chef',
    })) as RefundRecord[];
  }

  // --- Financial Adjustments ---
  static async createFinancialAdjustment(payload: Partial<FinancialAdjustment>): Promise<FinancialAdjustment> {
    const code = `ADJ-${Date.now().toString().slice(-6)}`;
    const record = {
      adjustmentCode: code,
      adjustmentType: payload.adjustment_type || 'MANUAL_ACCOUNTING_ENTRY',
      targetType: payload.target_type || 'CHEF',
      targetId: payload.target_id,
      amount: payload.amount || 0,
      entryType: payload.entry_type || 'CREDIT',
      reason: payload.reason || 'Manual financial adjustment',
      requestedBy: payload.requested_by,
      approvedBy: payload.approved_by,
      referenceEntityType: payload.reference_entity_type,
      referenceEntityId: payload.reference_entity_id,
      supportingNotes: payload.supporting_notes,
      status: payload.status || 'APPROVED',
    };

    try {
      const rows = await db.insert(financialAdjustments).values(record).returning();
      return rowToSnakeCase<FinancialAdjustment>(rows[0]);
    } catch (error: any) {
      console.warn('Fallback insert into financial_adjustments:', error.message);
      return { id: `adj_${Date.now()}`, ...record, created_at: new Date().toISOString() } as unknown as FinancialAdjustment;
    }
  }

  static async getFinancialAdjustments(limit = 50, offset = 0): Promise<FinancialAdjustment[]> {
    const rows = await db.select().from(financialAdjustments).orderBy(desc(financialAdjustments.createdAt)).limit(limit).offset(offset);

    if (rows.length === 0) {
      // Fallback to audit logs. The original used ilike '%ADJUSTMENT%'/
      // '%REVERSAL%', which doesn't map to a single typed Drizzle condition
      // as cleanly as eq — filtered in JS instead on a bounded result set.
      const allLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit * 5);
      const filtered = allLogs
        .filter((l) => l.action === 'PROCESS_REFUND' || l.action.includes('ADJUSTMENT') || l.action.includes('REVERSAL'))
        .slice(0, limit);

      return filtered.map((l) => {
        const mapped = rowToSnakeCase<any>(l);
        return {
          id: mapped.id,
          adjustment_code: `ADJ-${mapped.id.substring(0, 6).toUpperCase()}`,
          adjustment_type: mapped.action.includes('SETTLEMENT') ? 'SETTLEMENT_REVERSAL' : 'WALLET_CORRECTION',
          target_type: 'CHEF',
          target_id: mapped.entity_id,
          amount: Number(mapped.new_data?.refund_amount || mapped.new_data?.amount || 0),
          entry_type: mapped.action.includes('DEBIT') || mapped.action.includes('REVERSAL') ? 'DEBIT' : 'CREDIT',
          reason: mapped.action || 'Financial adjustment',
          requested_by: mapped.actor_id,
          approved_by: mapped.actor_id,
          reference_entity_type: mapped.entity_type || 'order',
          reference_entity_id: mapped.entity_id,
          supporting_notes: mapped.new_data ? JSON.stringify(mapped.new_data) : undefined,
          status: 'APPROVED',
          created_at: mapped.created_at,
        };
      }) as unknown as FinancialAdjustment[];
    }

    return rowsToSnakeCase<FinancialAdjustment>(rows);
  }
}
