import { and, desc, eq, ilike, inArray, notInArray, or, sql } from 'drizzle-orm';
import { db } from '../db/client';
import {
  adminNotes,
  auditLogs,
  deliveryPartners,
  dishes,
  kitchens,
  kitchenVerifications,
  notifications,
  orders,
  partnerDocuments,
  partnerSocietyAssignments,
  partyMenus,
  profiles,
  reviews,
  settlements,
  societies,
  wallets,
  walletTransactions,
  verificationRequests,
} from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { AdminNote, AuditLog } from '../types/crm';
import { Profile } from '../types/profile';

/**
 * Several real bugs found while converting this file (confirmed against the
 * Drizzle-introspected live schema):
 * - audit_logs doesn't have target_entity/target_entity_id/previous_value/
 *   new_value — the real columns are entity_type/entity_id/previous_data/
 *   new_data, plus a NOT NULL `module` column nothing ever set. Every
 *   createAuditLog call was silently swallowing a real DB error (try/catch
 *   -> console.warn), so no audit log has ever actually been written.
 * - admin_notes doesn't exist in the live database at all, despite being
 *   called by live CRM routes — created via supabase/local/004_admin_notes_table.sql.
 * - kitchens has no user_id/owner_id column (only chef_user_id) —
 *   updateProfileStatus's extra update/lookup attempts were silently
 *   swallowed no-ops.
 * - notifications.profile_id is NOT NULL, but updatePartnerKycStatus's
 *   insert only ever set user_id — every KYC-decision notification has been
 *   silently failing to insert.
 * - orders has no consumer_id/profile_id column, only customer_id — the
 *   getCustomerProfile .or() filter referencing all three would error
 *   against the real DB (not wrapped in try/catch, so this was a hard crash).
 * - reviews has no foreign key to profiles at all (kitchen_id/order_id are
 *   bare text, not real FKs) — the `profiles(name)` embedded join in
 *   getChefProfile's reviews query had no relationship to embed and would
 *   error (also not wrapped in try/catch).
 */

function auditLogRowToAuditLog(row: Record<string, any>): AuditLog {
  const mapped = rowToSnakeCase<any>(row);
  mapped.target_entity = mapped.entity_type;
  mapped.target_entity_id = mapped.entity_id;
  mapped.previous_value = mapped.previous_data;
  mapped.new_value = mapped.new_data;
  return mapped as AuditLog;
}

export class CrmRepository {
  static async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    try {
      let newData = log.new_value;
      if (log.reason) newData = newData ? { ...newData, reason: log.reason } : { reason: log.reason };

      await db.insert(auditLogs).values({
        actorId: log.actor_id,
        action: log.action,
        module: log.target_entity,
        entityType: log.target_entity,
        entityId: log.target_entity_id,
        previousData: log.previous_value,
        newData,
        ipAddress: log.ip_address,
      });
    } catch (e: any) {
      console.warn('[CrmRepository] createAuditLog error:', e.message || e);
    }
  }

  static async createAdminNote(note: Omit<AdminNote, 'id' | 'created_at' | 'updated_at'>): Promise<AdminNote> {
    const rows = await db.insert(adminNotes).values(toCamelCaseInput(note)).returning();
    return rowToSnakeCase<AdminNote>(rows[0]);
  }

  static async getNotesForEntity(entity_type: string, entity_id: string): Promise<AdminNote[]> {
    const rows = await db
      .select()
      .from(adminNotes)
      .where(and(eq(adminNotes.entityType, entity_type), eq(adminNotes.entityId, entity_id)))
      .orderBy(desc(adminNotes.createdAt));
    return rowsToSnakeCase<AdminNote>(rows);
  }

  static async updateProfileStatus(id: string, status: string): Promise<Profile> {
    const formattedStatus = (status || 'ACTIVE').toUpperCase();
    const isApproved = formattedStatus === 'ACTIVE';

    // kitchens only has chef_user_id (no user_id/owner_id) — try both the id
    // itself (in case a kitchen id was passed) and chef_user_id.
    try {
      await db.update(kitchens).set({ isVerified: isApproved }).where(eq(kitchens.id, id));
      await db.update(kitchens).set({ isVerified: isApproved }).where(eq(kitchens.chefUserId, id));
    } catch (e) {}

    let profileId = id;
    try {
      const k = await db.select({ chefUserId: kitchens.chefUserId }).from(kitchens).where(eq(kitchens.id, id)).limit(1);
      if (k[0]?.chefUserId) profileId = k[0].chefUserId;
    } catch (e) {}

    const rows = await db.update(profiles).set({ status: formattedStatus }).where(eq(profiles.id, profileId)).returning();
    return (rows[0] ? rowToSnakeCase<Profile>(rows[0]) : { id, status: formattedStatus }) as Profile;
  }

  static async searchCustomers(query: string, limit: number, offset: number): Promise<any[]> {
    try {
      const rows = await db
        .select()
        .from(profiles)
        .where(
          and(
            or(eq(profiles.role, 'consumer'), eq(profiles.role, 'CUSTOMER')),
            query ? ilike(profiles.name, `%${query}%`) : undefined
          )
        )
        .orderBy(desc(profiles.createdAt))
        .limit(limit)
        .offset(offset);

      return rowsToSnakeCase<any>(rows).map((p) => ({
        id: p.id,
        full_name: p.name || p.display_name || p.email || (p.phone ? `+${p.phone}` : 'Consumer User'),
        email: p.email || (p.phone ? `+${p.phone}` : 'N/A'),
        phone_number: p.phone ? `+${p.phone}` : 'N/A',
        status: (p.status || 'ACTIVE').toUpperCase(),
        created_at: p.created_at,
      }));
    } catch (e) {
      return [];
    }
  }

  static async searchChefs(query: string, limit: number, offset: number): Promise<any[]> {
    try {
      const rows = await db
        .select()
        .from(kitchens)
        .where(query ? ilike(kitchens.name, `%${query}%`) : undefined)
        .orderBy(desc(kitchens.createdAt))
        .limit(limit)
        .offset(offset);

      return rowsToSnakeCase<any>(rows).map((k) => {
        const status = k.is_verified ? 'ACTIVE' : 'PENDING';
        return {
          id: k.id,
          full_name: k.name || 'Home Kitchen',
          email: k.address || k.specialty || 'Home Kitchen',
          phone_number: k.specialty || 'Verified Kitchen',
          status,
          created_at: k.created_at,
        };
      });
    } catch (e) {
      return [];
    }
  }

  static async searchDeliveryPartners(query: string, limit: number, offset: number, status?: string): Promise<any[]> {
    const rows = await db
      .select()
      .from(deliveryPartners)
      .leftJoin(profiles, eq(deliveryPartners.userId, profiles.id))
      .where(status && status !== 'ALL' ? eq(deliveryPartners.status, status) : undefined)
      .orderBy(desc(deliveryPartners.createdAt));

    let filtered = rows.map(({ delivery_partners: partner, profiles: profile }) => {
      const mappedPartner = rowToSnakeCase<any>(partner);
      return {
        ...mappedPartner,
        profiles: profile
          ? rowToSnakeCase<any>(profile)
          : { name: 'Delivery Partner', phone: 'N/A', email: 'N/A' },
      };
    });

    if (query) {
      const qLower = query.toLowerCase();
      filtered = filtered.filter(
        (p: any) =>
          (p.profiles?.name || '').toLowerCase().includes(qLower) ||
          (p.profiles?.phone || '').includes(qLower) ||
          (p.id || '').includes(qLower) ||
          (p.vehicle_type || '').toLowerCase().includes(qLower)
      );
    }

    return filtered.slice(offset, offset + limit);
  }

  static async searchSocieties(query: string, limit: number, offset: number): Promise<any[]> {
    try {
      const rows = await db
        .select()
        .from(societies)
        .where(query ? or(ilike(societies.name, `%${query}%`), ilike(societies.city, `%${query}%`)) : undefined)
        .orderBy(desc(societies.createdAt))
        .limit(limit)
        .offset(offset);

      if (rows.length > 0) {
        return rowsToSnakeCase<any>(rows).map((s) => ({
          id: s.id,
          name: s.name || 'Housing Society',
          full_name: s.name || 'Housing Society',
          city: s.city || 'Metro Area',
          delivery_radius_km: 2.5,
          is_active: true,
          status: 'ACTIVE',
          created_at: s.created_at || new Date().toISOString(),
        }));
      }

      const kitchenRows = await db.select({ address: kitchens.address, createdAt: kitchens.createdAt }).from(kitchens);
      const societiesMap = new Map<string, any>();
      kitchenRows.forEach((k) => {
        const name = k.address || 'Central Society Hub';
        if (!societiesMap.has(name)) {
          societiesMap.set(name, {
            id: `soc-${societiesMap.size + 1}`,
            name,
            full_name: name,
            city: 'Metro Area',
            delivery_radius_km: 2.5,
            is_active: true,
            status: 'ACTIVE',
            created_at: k.createdAt || new Date().toISOString(),
          });
        }
      });
      return Array.from(societiesMap.values());
    } catch (e) {
      return [];
    }
  }

  static async searchOrders(query: string, limit: number, offset: number): Promise<any[]> {
    try {
      const rows = await db
        .select()
        .from(orders)
        .where(query ? eq(orders.id, query) : undefined)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);
      return rowsToSnakeCase<any>(rows);
    } catch (e) {
      return [];
    }
  }

  static async getAuditLogs(limit: number, offset: number, entity_type?: string): Promise<AuditLog[]> {
    try {
      const rows = await db
        .select()
        .from(auditLogs)
        .where(entity_type ? eq(auditLogs.entityType, entity_type) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
      return rows.map(auditLogRowToAuditLog);
    } catch (e) {
      return [];
    }
  }

  static async updatePartnerStatus(partnerId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<any> {
    const rows = await db.update(deliveryPartners).set({ status }).where(eq(deliveryPartners.id, partnerId)).returning();
    const partner = rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
    if (!partner) throw new Error(`Delivery partner ${partnerId} not found`);

    if (partner.user_id) {
      await db.update(profiles).set({ status: status.toLowerCase() }).where(eq(profiles.id, partner.user_id));
    }
    return partner;
  }

  static async assignPartnerSociety(partnerId: string, payload: any): Promise<any> {
    const rows = await db
      .insert(partnerSocietyAssignments)
      .values({
        partnerId,
        societyId: payload.society_id,
        towerCoverage: payload.tower_coverage,
        deliveryRadiusKm: payload.delivery_radius_km,
        workingZone: payload.working_zone,
        shiftTimingStart: payload.shift_timing_start,
        shiftTimingEnd: payload.shift_timing_end,
      })
      .onConflictDoUpdate({
        target: partnerSocietyAssignments.partnerId,
        set: {
          societyId: payload.society_id,
          towerCoverage: payload.tower_coverage,
          deliveryRadiusKm: payload.delivery_radius_km,
          workingZone: payload.working_zone,
          shiftTimingStart: payload.shift_timing_start,
          shiftTimingEnd: payload.shift_timing_end,
        },
      })
      .returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async updatePartnerKycStatus(partnerId: string, status: 'APPROVED' | 'REJECTED', notes?: string): Promise<any> {
    let flaggedDocs: string[] = [];
    let cleanNotes = notes || '';
    if (notes && notes.startsWith('{')) {
      try {
        const parsed = JSON.parse(notes);
        flaggedDocs = parsed.flaggedDocs || [];
        cleanNotes = parsed.notes || 'Documents verification failed';
      } catch (e) {}
    }

    const details: any = { kycStatus: status };
    if (status === 'APPROVED') {
      details.status = 'ACTIVE';
      details.rejectionReason = null;
    } else {
      details.status = 'SUSPENDED';
      details.rejectionReason = cleanNotes;
    }

    let rows = await db.update(deliveryPartners).set(details).where(eq(deliveryPartners.id, partnerId)).returning();
    if (!rows[0]) {
      rows = await db.update(deliveryPartners).set(details).where(eq(deliveryPartners.userId, partnerId)).returning();
    }
    if (!rows[0]) throw new Error(`Delivery partner with ID ${partnerId} not found`);

    const partner = rowToSnakeCase<any>(rows[0]);
    const actualPartnerId = partner.id;

    await db
      .update(verificationRequests)
      .set({ status, notes: cleanNotes, updatedAt: new Date().toISOString() })
      .where(eq(verificationRequests.partnerId, actualPartnerId));

    if (status === 'APPROVED') {
      await db
        .update(partnerDocuments)
        .set({ status: 'APPROVED', rejectionReason: null })
        .where(eq(partnerDocuments.partnerId, actualPartnerId));
    } else if (flaggedDocs.length > 0) {
      await db
        .update(partnerDocuments)
        .set({ status: 'REJECTED', rejectionReason: cleanNotes })
        .where(and(eq(partnerDocuments.partnerId, actualPartnerId), inArray(partnerDocuments.documentType, flaggedDocs)));
      await db
        .update(partnerDocuments)
        .set({ status: 'APPROVED', rejectionReason: null })
        .where(and(eq(partnerDocuments.partnerId, actualPartnerId), notInArray(partnerDocuments.documentType, flaggedDocs)));
    } else {
      await db
        .update(partnerDocuments)
        .set({ status: 'REJECTED', rejectionReason: cleanNotes })
        .where(eq(partnerDocuments.partnerId, actualPartnerId));
    }

    if (partner.user_id) {
      try {
        await db.insert(notifications).values({
          profileId: partner.user_id,
          userId: partner.user_id,
          title: status === 'APPROVED' ? 'KYC Verified' : 'KYC Rejected',
          message:
            status === 'APPROVED'
              ? 'Your KYC documents have been verified successfully. You can now accept deliveries!'
              : `Your KYC documents were rejected: ${cleanNotes || 'Verification failed'}`,
          type: 'KYC_STATUS',
        });
      } catch (e: any) {
        console.warn('[CrmRepository] Insert notification failed:', e.message || e);
      }
    }

    return partner;
  }

  static async getChefProfile(kitchenId: string): Promise<any> {
    const kitchenRows = await db.select().from(kitchens).where(eq(kitchens.id, kitchenId)).limit(1);
    if (!kitchenRows[0]) throw new Error('Chef kitchen profile not found');
    const kitchen = rowToSnakeCase<any>(kitchenRows[0]);

    const profileRows = await db.select().from(profiles).where(eq(profiles.id, kitchen.chef_user_id)).limit(1);
    const profile = profileRows[0] ? rowToSnakeCase<any>(profileRows[0]) : null;

    const walletRows = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, kitchen.chef_user_id), eq(wallets.walletType, 'CHEF')))
      .limit(1);
    const wallet = walletRows[0] ? rowToSnakeCase<any>(walletRows[0]) : null;

    let walletTxns: any[] = [];
    if (wallet) {
      const txRows = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(20);
      walletTxns = rowsToSnakeCase<any>(txRows);
    }

    // orders really does have a FK to profiles (via customer_id) — attach
    // the customer's name via a lookup rather than Supabase's embedded-join
    // shorthand, which Drizzle doesn't have an equivalent for.
    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.kitchenId, kitchenId))
      .orderBy(desc(orders.createdAt))
      .limit(20);
    const orderCustomerIds = [...new Set(orderRows.map((o) => o.customerId).filter(Boolean))] as string[];
    const orderCustomers = orderCustomerIds.length
      ? await db.select({ id: profiles.id, name: profiles.name }).from(profiles).where(inArray(profiles.id, orderCustomerIds))
      : [];
    const customerNameById = new Map(orderCustomers.map((c) => [c.id, c.name]));
    const ordersWithProfiles = orderRows.map((o) => ({
      ...rowToSnakeCase<any>(o),
      profiles: { name: customerNameById.get(o.customerId as string) || null },
    }));

    const settlementRows = await db
      .select()
      .from(settlements)
      .where(eq(settlements.kitchenId, kitchenId))
      .orderBy(desc(settlements.createdAt))
      .limit(20);

    const verificationRows = await db.select().from(kitchenVerifications).where(eq(kitchenVerifications.kitchenId, kitchenId)).limit(1);

    const dishRows = await db.select().from(dishes).where(eq(dishes.kitchenId, kitchenId));

    const partyMenuRows = await db.select().from(partyMenus).where(eq(partyMenus.kitchenId, kitchenId)).limit(1);

    // reviews has NO foreign key to profiles at all (kitchen_id/order_id are
    // bare text) — the original embedded join here had no relationship to
    // embed and would have errored. Attach reviewer names via a manual
    // lookup against whichever of consumer_id/customer_id is populated.
    const reviewRows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.kitchenId, kitchenId))
      .orderBy(desc(reviews.createdAt))
      .limit(20);
    const reviewerIds = [
      ...new Set(reviewRows.map((r) => r.consumerId || r.customerId).filter(Boolean)),
    ] as string[];
    const reviewers = reviewerIds.length
      ? await db.select({ id: profiles.id, name: profiles.name }).from(profiles).where(inArray(profiles.id, reviewerIds))
      : [];
    const reviewerNameById = new Map(reviewers.map((r) => [r.id, r.name]));
    const reviewsWithProfiles = reviewRows.map((r) => ({
      ...rowToSnakeCase<any>(r),
      profiles: { name: reviewerNameById.get((r.consumerId || r.customerId) as string) || null },
    }));

    return {
      kitchen,
      profile: profile || { id: kitchen.chef_user_id, name: 'Chef User', phone: '+919999999999' },
      wallet: wallet || { balance: 0 },
      walletTransactions: walletTxns,
      orders: ordersWithProfiles,
      settlements: rowsToSnakeCase<any>(settlementRows),
      verification: verificationRows[0] ? rowToSnakeCase<any>(verificationRows[0]) : null,
      dishes: rowsToSnakeCase<any>(dishRows),
      partyMenu: partyMenuRows[0] ? rowToSnakeCase<any>(partyMenuRows[0]) : null,
      reviews: reviewsWithProfiles,
    };
  }

  static async getCustomerProfile(customerId: string): Promise<any> {
    const profileRows = await db.select().from(profiles).where(eq(profiles.id, customerId)).limit(1);
    if (!profileRows[0]) throw new Error('Customer profile not found');
    const profile = rowToSnakeCase<any>(profileRows[0]);

    const walletRows = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, customerId), eq(wallets.walletType, 'CONSUMER')))
      .limit(1);
    const wallet = walletRows[0] ? rowToSnakeCase<any>(walletRows[0]) : null;

    let walletTxns: any[] = [];
    if (wallet) {
      const txRows = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt));
      walletTxns = rowsToSnakeCase<any>(txRows);
    }

    // orders has no consumer_id/profile_id column (only customer_id) — the
    // original .or() across all three would have errored against the real
    // database every time this ran.
    const orderRows = await db
      .select()
      .from(orders)
      .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(20);
    const ordersWithKitchens = orderRows.map(({ orders: order, kitchens: kitchen }) => ({
      ...rowToSnakeCase<any>(order),
      kitchens: kitchen ? { name: kitchen.name } : null,
    }));

    return {
      profile,
      wallet: wallet || { balance: 0 },
      walletTransactions: walletTxns,
      orders: ordersWithKitchens,
    };
  }
}
