import { and, desc, eq, gte, ne, notInArray } from 'drizzle-orm';
import { db } from '../db/client';
import { deliveryPartners, deliveryAssignments, deliveryPartnerLocation, deliveryTracking, deliveryEarnings, orders, kitchens, profiles } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import { DeliveryPartner, DeliveryAssignment, DeliveryStatus, DeliveryTracking, DeliveryEarnings } from '../types/delivery';

const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED', 'REJECTED', 'FAILED'];

/**
 * delivery_partners has no vehicle_details/license_number/current_lat/
 * current_lng columns at all (real names/equivalents: vehicle_type,
 * current_latitude/current_longitude; there's no column for a license
 * number — partner_documents is where license images are tracked). is_online
 * and updated_at were genuinely missing and have been added (see
 * supabase/local/005_delivery_partner_online_columns.sql) since the
 * online/offline toggle this file implements is live, frequently-exercised
 * functionality that getAvailablePartners (order assignment) depends on.
 *
 * registerPartner is rewritten to match the already-correct, already-working
 * insert shape used by PartnerRepository.getOrCreatePartner (user_id,
 * vehicle_type, status, kyc_status) rather than the columns this file
 * previously assumed, none of which exist.
 */

export class DeliveryRepository {
  static async registerPartner(payload: { id: string; user_id?: string; vehicle_type?: string }): Promise<DeliveryPartner> {
    const rows = await db
      .insert(deliveryPartners)
      .values({
        userId: payload.user_id || payload.id,
        vehicleType: payload.vehicle_type || 'SCOOTER',
        status: 'OFFLINE',
        kycStatus: 'PENDING',
        isOnline: false,
      })
      .returning();
    return rowToSnakeCase<DeliveryPartner>(rows[0]);
  }

  static async updatePartnerStatus(id: string, is_online: boolean, current_lat?: number, current_lng?: number): Promise<DeliveryPartner> {
    const updatePayload: any = { isOnline: is_online, updatedAt: new Date().toISOString() };
    if (current_lat !== undefined) updatePayload.currentLatitude = current_lat;
    if (current_lng !== undefined) updatePayload.currentLongitude = current_lng;

    const rows = await db.update(deliveryPartners).set(updatePayload).where(eq(deliveryPartners.id, id)).returning();
    return rowToSnakeCase<DeliveryPartner>(rows[0]);
  }

  static async getAvailablePartners(limit: number = 10): Promise<DeliveryPartner[]> {
    // delivery_partners.status defaults to 'OFFLINE' for every partner and
    // only ever moves to 'ACTIVE'/'SUSPENDED' via admin action
    // (crm.repository.ts#updatePartnerStatus) — it's never actually set to
    // something meaning "currently online" (that's is_online's job, gated on
    // KYC approval before the toggle endpoint allows it). So "available"
    // correctly means online and not admin-suspended, not literally
    // status = 'ACTIVE'.
    const rows = await db
      .select()
      .from(deliveryPartners)
      .where(and(eq(deliveryPartners.isOnline, true), ne(deliveryPartners.status, 'SUSPENDED')))
      // Ideally joined with assignments to check if they are busy
      .limit(limit);
    return rowsToSnakeCase<DeliveryPartner>(rows);
  }

  static async createAssignment(assignment: Omit<DeliveryAssignment, 'id' | 'assigned_at' | 'accepted_at' | 'picked_up_at' | 'delivered_at'>): Promise<DeliveryAssignment> {
    const rows = await db
      .insert(deliveryAssignments)
      .values({
        orderId: assignment.order_id,
        partnerId: assignment.partner_id,
        status: assignment.status,
        pickupOtp: assignment.pickup_otp,
        deliveryOtp: assignment.delivery_otp,
      })
      .returning();
    return rowToSnakeCase<DeliveryAssignment>(rows[0]);
  }

  static async getAssignment(id: string): Promise<DeliveryAssignment> {
    const rows = await db.select().from(deliveryAssignments).where(eq(deliveryAssignments.id, id)).limit(1);
    if (!rows[0]) throw new Error(`Delivery assignment ${id} not found`);
    return rowToSnakeCase<DeliveryAssignment>(rows[0]);
  }

  static async getAssignmentByOrder(order_id: string): Promise<DeliveryAssignment> {
    const rows = await db
      .select()
      .from(deliveryAssignments)
      .where(eq(deliveryAssignments.orderId, order_id))
      .orderBy(desc(deliveryAssignments.assignedAt))
      .limit(1);
    if (!rows[0]) throw new Error(`No delivery assignment found for order ${order_id}`);
    return rowToSnakeCase<DeliveryAssignment>(rows[0]);
  }

  static async updateAssignmentStatus(id: string, status: DeliveryStatus, timestampField?: string): Promise<DeliveryAssignment> {
    const updatePayload: any = { status };
    if (timestampField) {
      const camelField = timestampField.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      updatePayload[camelField] = new Date().toISOString();
    }

    const rows = await db.update(deliveryAssignments).set(updatePayload).where(eq(deliveryAssignments.id, id)).returning();
    return rowToSnakeCase<DeliveryAssignment>(rows[0]);
  }

  static async recordTracking(tracking: Omit<DeliveryTracking, 'id' | 'timestamp'>): Promise<void> {
    await db.insert(deliveryTracking).values({
      assignmentId: tracking.assignment_id,
      lat: tracking.lat,
      lng: tracking.lng,
    });

    try {
      const assignment = await this.getAssignment(tracking.assignment_id);
      if (assignment) {
        await db.insert(deliveryPartnerLocation).values({
          partnerId: assignment.partner_id,
          orderId: assignment.order_id,
          latitude: tracking.lat,
          longitude: tracking.lng,
          capturedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to write delivery_partner_location:', err);
    }
  }

  static async markPartnerAvailable(partnerId: string): Promise<void> {
    await db.update(deliveryPartners).set({ status: 'AVAILABLE' }).where(eq(deliveryPartners.id, partnerId));
  }

  static async releaseOrderForReassignment(orderId: string): Promise<void> {
    await db.update(orders).set({ status: 'READY', deliveryPartnerId: null }).where(eq(orders.id, orderId));
  }

  static async createEarnings(earnings: Omit<DeliveryEarnings, 'id' | 'created_at' | 'status'>): Promise<void> {
    await db.insert(deliveryEarnings).values({
      assignmentId: earnings.assignment_id,
      partnerId: earnings.partner_id,
      amount: earnings.amount,
      status: 'PENDING',
    });
  }

  /** Assignments not yet in a terminal state — "what am I currently working on". */
  static async getActiveAssignmentsForPartner(partnerId: string): Promise<any[]> {
    const rows = await db
      .select({
        assignment: deliveryAssignments,
        orderCode: orders.orderCode,
        deliveryFee: orders.deliveryFee,
        deliveryAddress: orders.deliveryAddress,
        kitchenName: kitchens.name,
        kitchenAddress: kitchens.address,
        customerName: profiles.name,
        customerPhone: profiles.phone,
      })
      .from(deliveryAssignments)
      .innerJoin(orders, eq(deliveryAssignments.orderId, orders.id))
      .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
      .leftJoin(profiles, eq(orders.customerId, profiles.id))
      .where(and(eq(deliveryAssignments.partnerId, partnerId), notInArray(deliveryAssignments.status, TERMINAL_STATUSES)))
      .orderBy(desc(deliveryAssignments.assignedAt));

    return rows.map((r) => ({
      ...rowToSnakeCase<any>(r.assignment),
      order_code: r.orderCode,
      delivery_fee: r.deliveryFee,
      delivery_address: r.deliveryAddress,
      kitchen_name: r.kitchenName,
      kitchen_address: r.kitchenAddress,
      customer_name: r.customerName,
      customer_phone: r.customerPhone,
    }));
  }

  /** Today's completed-delivery count + earned amount for the dashboard summary. */
  static async getTodaySummaryForPartner(partnerId: string): Promise<{ today_earnings: number; deliveries_completed_today: number }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const earningsRows = await db
      .select({ amount: deliveryEarnings.amount })
      .from(deliveryEarnings)
      .where(and(eq(deliveryEarnings.partnerId, partnerId), gte(deliveryEarnings.createdAt, todayStart.toISOString())));

    return {
      today_earnings: earningsRows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
      deliveries_completed_today: earningsRows.length,
    };
  }
}
