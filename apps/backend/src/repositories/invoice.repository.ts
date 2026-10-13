import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { invoices, payoutRequests } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Invoice, PayoutRequest, PayoutStatus } from '../types/invoice';

// invoices never existed (confirmed absent from the live schema dump)
// despite being wired to fire on every completed order
// (invoice.service.ts). Caught in a try/catch at the event-listener level,
// so failed silently rather than breaking order completion. Created via
// supabase/local/013_invoices_table.sql. payout_requests already existed
// (created earlier this session) and matches this file's assumptions
// exactly — no changes needed there.
export class InvoiceRepository {
  static async createInvoice(invoice: Omit<Invoice, 'id' | 'issued_at'>): Promise<Invoice> {
    const rows = await db.insert(invoices).values(toCamelCaseInput(invoice) as any).returning();
    return rowToSnakeCase<Invoice>(rows[0]);
  }

  static async getInvoices(profile_id: string): Promise<Invoice[]> {
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.issuedTo, profile_id))
      .orderBy(desc(invoices.issuedAt));
    return rowsToSnakeCase<Invoice>(rows);
  }

  static async requestPayout(payout: Omit<PayoutRequest, 'id' | 'status' | 'requested_at' | 'processed_at'>): Promise<PayoutRequest> {
    const rows = await db
      .insert(payoutRequests)
      .values({ ...(toCamelCaseInput(payout) as any), status: 'PENDING' })
      .returning();
    return rowToSnakeCase<PayoutRequest>(rows[0]);
  }

  static async updatePayoutStatus(id: string, status: PayoutStatus, reference_id?: string): Promise<PayoutRequest> {
    const updatePayload: any = { status, processedAt: new Date().toISOString() };
    if (reference_id) updatePayload.referenceId = reference_id;

    const rows = await db.update(payoutRequests).set(updatePayload).where(eq(payoutRequests.id, id)).returning();
    return rowToSnakeCase<PayoutRequest>(rows[0]);
  }

  static async getPayoutsByKitchen(kitchen_id: string): Promise<PayoutRequest[]> {
    const rows = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.kitchenId, kitchen_id))
      .orderBy(desc(payoutRequests.requestedAt));
    return rowsToSnakeCase<PayoutRequest>(rows);
  }
}
