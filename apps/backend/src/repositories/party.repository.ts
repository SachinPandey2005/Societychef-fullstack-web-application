import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../db/client';
import { orders, partyMenus, kitchens, profiles } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';

export interface CreatePartyOrderInput {
  customer_id: string;
  kitchen_id: string;
  total_amount: number;
  delivery_address?: string;
  booking_date: string;
  guest_count: number;
  pack_name?: string;
  per_head_price: number;
  selected_dishes?: any;
}

export class PartyRepository {
  static async getMenuByKitchenId(kitchenId: string) {
    const rows = await db.select().from(partyMenus).where(eq(partyMenus.kitchenId, kitchenId)).limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async upsertMenu(kitchenId: string, payload: { is_enabled: boolean; min_guests: number; advance_notice_hours: number; packages: any; dishes: any }) {
    const existing = await db.select({ id: partyMenus.id }).from(partyMenus).where(eq(partyMenus.kitchenId, kitchenId)).limit(1);
    const values = {
      kitchenId,
      isEnabled: payload.is_enabled,
      minGuests: payload.min_guests,
      advanceNoticeHours: payload.advance_notice_hours,
      packages: payload.packages,
      dishes: payload.dishes,
      updatedAt: new Date().toISOString(),
    };
    const rows = existing[0]
      ? await db.update(partyMenus).set(values).where(eq(partyMenus.kitchenId, kitchenId)).returning()
      : await db.insert(partyMenus).values(values).returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  /** Kitchens with an enabled party menu, joined with their own name/address. */
  static async getEnabledKitchens() {
    const rows = await db
      .select({
        kitchenId: kitchens.id,
        name: kitchens.name,
        chefName: kitchens.chefName,
        address: kitchens.address,
        isTopRated: kitchens.isTopRated,
        minGuests: partyMenus.minGuests,
        packages: partyMenus.packages,
      })
      .from(partyMenus)
      .innerJoin(kitchens, eq(partyMenus.kitchenId, kitchens.id))
      .where(eq(partyMenus.isEnabled, true));
    return rowsToSnakeCase<any>(rows);
  }

  /** Resolves a kitchen for party booking by id, or a loose name match as a fallback for legacy slug-style ids. */
  static async resolveKitchenId(kitchenIdOrSlug: string): Promise<string | null> {
    if (kitchenIdOrSlug.length === 36) {
      const rows = await db.select({ id: kitchens.id }).from(kitchens).where(eq(kitchens.id, kitchenIdOrSlug)).limit(1);
      if (rows[0]) return rows[0].id;
    }
    const cleanSlug = kitchenIdOrSlug.replace(/-kitchen$/i, '').replace(/_/g, ' ');
    const rows = await db
      .select({ id: kitchens.id })
      .from(kitchens)
      .where(or(ilike(kitchens.name, `%${cleanSlug}%`), ilike(kitchens.chefName, `%${cleanSlug}%`)))
      .limit(1);
    return rows[0]?.id || null;
  }

  static async createPartyOrder(payload: CreatePartyOrderInput) {
    const orderCode = `PARTY-${Math.floor(1000 + Math.random() * 9000)}`;
    const rows = await db
      .insert(orders)
      .values({
        orderCode,
        customerId: payload.customer_id,
        kitchenId: payload.kitchen_id,
        status: 'PLACED',
        deliveryMethod: 'DELIVERY_PARTNER',
        deliveryFee: 0,
        itemTotal: payload.total_amount,
        grandTotal: payload.total_amount,
        totalPaid: payload.total_amount,
        deliveryAddress: payload.delivery_address,
        isPartyOrder: true,
        partyBookingDate: payload.booking_date,
        guestCount: payload.guest_count,
        selectedPackName: payload.pack_name,
        perHeadPrice: payload.per_head_price,
        partyDishes: payload.selected_dishes || [],
      })
      .returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async getBookings() {
    const rows = await db
      .select({
        order: orders,
        customerName: profiles.name,
        customerPhone: profiles.phone,
        customerEmail: profiles.email,
        kitchenName: kitchens.name,
        chefName: kitchens.chefName,
        specialty: kitchens.specialty,
      })
      .from(orders)
      .leftJoin(profiles, eq(orders.customerId, profiles.id))
      .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
      .where(eq(orders.isPartyOrder, true))
      .orderBy(desc(orders.createdAt));
    return rows.map((r) => ({
      ...rowToSnakeCase<any>(r.order),
      profiles: { name: r.customerName, phone: r.customerPhone, email: r.customerEmail },
      kitchens: { name: r.kitchenName, chef_name: r.chefName, specialty: r.specialty },
    }));
  }

  static async getBookingById(id: string) {
    const rows = await db
      .select({
        order: orders,
        customerName: profiles.name,
        customerPhone: profiles.phone,
        customerEmail: profiles.email,
        kitchenName: kitchens.name,
        chefName: kitchens.chefName,
        specialty: kitchens.specialty,
      })
      .from(orders)
      .leftJoin(profiles, eq(orders.customerId, profiles.id))
      .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
      .where(and(eq(orders.id, id), eq(orders.isPartyOrder, true)))
      .limit(1);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...rowToSnakeCase<any>(r.order),
      profiles: { name: r.customerName, phone: r.customerPhone, email: r.customerEmail },
      kitchens: { name: r.kitchenName, chef_name: r.chefName, specialty: r.specialty },
    };
  }

  static async updateBookingStatus(id: string, status: string) {
    const rows = await db
      .update(orders)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(and(eq(orders.id, id), eq(orders.isPartyOrder, true)))
      .returning();
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async getBookingForPacks(id: string) {
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        guestCount: orders.guestCount,
        totalPaid: orders.totalPaid,
        grandTotal: orders.grandTotal,
        perHeadPrice: orders.perHeadPrice,
        isPartyOrder: orders.isPartyOrder,
      })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.isPartyOrder, true)))
      .limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async applyPackAddon(id: string, updates: { guest_count: number; total_paid: number; grand_total: number; status?: string; payment_status?: string }) {
    const setValues: Record<string, any> = {
      guestCount: updates.guest_count,
      totalPaid: updates.total_paid,
      grandTotal: updates.grand_total,
      updatedAt: new Date().toISOString(),
    };
    if (updates.status) setValues.status = updates.status;
    if (updates.payment_status) setValues.paymentStatus = updates.payment_status;
    const rows = await db.update(orders).set(setValues).where(eq(orders.id, id)).returning();
    return rowToSnakeCase<any>(rows[0]);
  }
}
