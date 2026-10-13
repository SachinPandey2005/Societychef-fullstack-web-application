import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { payments, webhookEvents } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { CreatePaymentInput, Payment } from '../types/payment';

export class PaymentRepository {
  static async createPayment(payload: CreatePaymentInput): Promise<Payment> {
    const rows = await db.insert(payments).values(toCamelCaseInput(payload) as any).returning();
    return rowToSnakeCase<Payment>(rows[0]);
  }

  static async findByRazorpayOrderId(razorpay_order_id: string): Promise<Payment | null> {
    const rows = await db.select().from(payments).where(eq(payments.razorpayOrderId, razorpay_order_id)).limit(1);
    return rows[0] ? rowToSnakeCase<Payment>(rows[0]) : null;
  }

  static async findByInternalOrderId(order_id: string): Promise<Payment[]> {
    const rows = await db.select().from(payments).where(eq(payments.orderId, order_id));
    return rowsToSnakeCase<Payment>(rows);
  }

  static async updatePaymentRecord(id: string, updates: Partial<Payment>): Promise<Payment> {
    const rows = await db
      .update(payments)
      .set({ ...toCamelCaseInput(updates) as any, updatedAt: new Date().toISOString() })
      .where(eq(payments.id, id))
      .returning();
    return rowToSnakeCase<Payment>(rows[0]);
  }

  static async findByCfOrderId(cf_order_id: string): Promise<Payment | null> {
    const rows = await db.select().from(payments).where(eq(payments.cfOrderId, cf_order_id)).limit(1);
    return rows[0] ? rowToSnakeCase<Payment>(rows[0]) : null;
  }

  static async findWebhookEvent(event_id: string): Promise<any | null> {
    const rows = await db.select().from(webhookEvents).where(eq(webhookEvents.eventId, event_id)).limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async recordWebhookEvent(payload: {
    event_id: string;
    event_type: string;
    cf_order_id?: string;
    payload?: any;
  }): Promise<void> {
    try {
      await db.insert(webhookEvents).values(toCamelCaseInput(payload) as any);
    } catch {
      // Ignore unique constraint violation if a duplicate arrives concurrently
    }
  }

  static async findById(id: string): Promise<Payment | null> {
    const rows = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<Payment>(rows[0]) : null;
  }

  static async getPaymentHistory(consumer_id: string): Promise<Payment[]> {
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.consumerId, consumer_id))
      .orderBy(desc(payments.createdAt))
      .limit(100);
    return rowsToSnakeCase<Payment>(rows);
  }
}
