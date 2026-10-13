import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { db } from '../db/client';
import {
  kitchenVerifications,
  kitchens,
  verificationRequests,
  deliveryPartners,
  profiles,
  partnerVehicles,
  partnerDocuments,
  partnerSocietyAssignments,
  societies,
} from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import { KitchenVerification, VerificationStatus } from '../types/verification';

// All tables here are real — a clean conversion with no schema mismatches,
// just query-layer translation. The repeated `partner_id.eq.X OR
// partner_id.eq.user_id` pattern is preserved exactly (defensive against
// historical rows possibly keyed by the wrong id), even though the real FK
// is only ever delivery_partners.id.
export class VerificationRepository {
  static async getVerificationRequest(kitchen_id: string): Promise<KitchenVerification | null> {
    const rows = await db.select().from(kitchenVerifications).where(eq(kitchenVerifications.kitchenId, kitchen_id)).limit(1);
    return rows[0] ? rowToSnakeCase<KitchenVerification>(rows[0]) : null;
  }

  static async findById(id: string): Promise<KitchenVerification | null> {
    const rows = await db.select().from(kitchenVerifications).where(eq(kitchenVerifications.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<KitchenVerification>(rows[0]) : null;
  }

  static async updateStatus(id: string, status: VerificationStatus, verifier_id: string, notes?: string): Promise<KitchenVerification> {
    const rows = await db
      .update(kitchenVerifications)
      .set({ status, verifierId: verifier_id, verificationNotes: notes, verificationDate: new Date().toISOString() })
      .where(eq(kitchenVerifications.id, id))
      .returning();
    return rowToSnakeCase<KitchenVerification>(rows[0]);
  }

  static async getPendingVerifications(limit: number, offset: number): Promise<any[]> {
    const rows = await db
      .select({ verification: kitchenVerifications, kitchen: kitchens })
      .from(kitchenVerifications)
      .leftJoin(kitchens, eq(kitchenVerifications.kitchenId, kitchens.id))
      .where(eq(kitchenVerifications.status, 'PENDING'))
      .orderBy(desc(kitchenVerifications.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map(({ verification, kitchen }) => ({
      ...rowToSnakeCase<any>(verification),
      kitchen_profiles: kitchen ? rowToSnakeCase<any>(kitchen) : null,
      type: 'KITCHEN',
    }));
  }

  static async getPendingPartnerVerifications(limit: number, offset: number): Promise<any[]> {
    const requests = await db
      .select()
      .from(verificationRequests)
      .where(inArray(verificationRequests.status, ['PENDING', 'UNDER_REVIEW', 'PENDING_REVIEW', 'SUBMITTED']))
      .orderBy(desc(verificationRequests.createdAt));

    const partnerIdsSeen = new Set<string>();
    const enrichedRequests: any[] = [];

    async function lookupExtras(partnerId: string, userId: string | null) {
      const partnerOrUser = userId
        ? or(eq(partnerVehicles.partnerId, partnerId), eq(partnerVehicles.partnerId, userId))
        : eq(partnerVehicles.partnerId, partnerId);
      const vehicleRows = await db.select().from(partnerVehicles).where(partnerOrUser).limit(1);

      const docCondition = userId
        ? or(eq(partnerDocuments.partnerId, partnerId), eq(partnerDocuments.partnerId, userId))
        : eq(partnerDocuments.partnerId, partnerId);
      const documentRows = await db.select().from(partnerDocuments).where(docCondition);

      const assignmentCondition = userId
        ? or(eq(partnerSocietyAssignments.partnerId, partnerId), eq(partnerSocietyAssignments.partnerId, userId))
        : eq(partnerSocietyAssignments.partnerId, partnerId);
      const assignmentRows = await db
        .select({ assignment: partnerSocietyAssignments, society: societies })
        .from(partnerSocietyAssignments)
        .leftJoin(societies, eq(partnerSocietyAssignments.societyId, societies.id))
        .where(assignmentCondition)
        .limit(1);

      return {
        vehicle: vehicleRows[0] ? rowToSnakeCase<any>(vehicleRows[0]) : null,
        documents: rowsToSnakeCase<any>(documentRows),
        society: assignmentRows[0]?.society?.name || 'Unassigned',
      };
    }

    for (const req of requests) {
      if (!req.partnerId) continue;

      const partnerRows = await db
        .select({ partner: deliveryPartners, profile: profiles })
        .from(deliveryPartners)
        .leftJoin(profiles, eq(deliveryPartners.userId, profiles.id))
        .where(or(eq(deliveryPartners.id, req.partnerId), eq(deliveryPartners.userId, req.partnerId)))
        .limit(1);

      if (!partnerRows[0]) continue;
      const { partner, profile } = partnerRows[0];
      if (partnerIdsSeen.has(partner.id) || partnerIdsSeen.has(partner.userId)) continue;
      partnerIdsSeen.add(partner.id);
      if (partner.userId) partnerIdsSeen.add(partner.userId);

      const extras = await lookupExtras(partner.id, partner.userId);
      const mappedPartner = rowToSnakeCase<any>(partner);

      enrichedRequests.push({
        id: req.id || partner.id,
        partner_id: partner.id,
        user_id: partner.userId,
        type: 'PARTNER',
        status: req.status || mappedPartner.kyc_status || 'UNDER_REVIEW',
        created_at: req.createdAt || mappedPartner.updated_at || mappedPartner.created_at,
        notes: req.notes || mappedPartner.rejection_reason || null,
        profiles: profile ? rowToSnakeCase<any>(profile) : { name: 'Delivery Rider', phone: 'N/A' },
        partner: mappedPartner,
        vehicle: extras.vehicle,
        documents: extras.documents,
        society: extras.society,
      });
    }

    // Direct fallback query on delivery_partners for any partner with kyc_status NOT APPROVED or with uploaded documents
    const pendingPartnerRows = await db
      .select({ partner: deliveryPartners, profile: profiles })
      .from(deliveryPartners)
      .leftJoin(profiles, eq(deliveryPartners.userId, profiles.id))
      .where(inArray(deliveryPartners.kycStatus, ['UNDER_REVIEW', 'PENDING_REVIEW', 'PENDING', 'SUBMITTED']))
      .orderBy(desc(deliveryPartners.updatedAt));

    for (const { partner, profile } of pendingPartnerRows) {
      if (partnerIdsSeen.has(partner.id) || partnerIdsSeen.has(partner.userId)) continue;
      partnerIdsSeen.add(partner.id);
      if (partner.userId) partnerIdsSeen.add(partner.userId);

      const extras = await lookupExtras(partner.id, partner.userId);
      const mappedPartner = rowToSnakeCase<any>(partner);

      enrichedRequests.push({
        id: partner.id,
        partner_id: partner.id,
        user_id: partner.userId,
        type: 'PARTNER',
        status: mappedPartner.kyc_status || 'UNDER_REVIEW',
        created_at: mappedPartner.updated_at || mappedPartner.created_at,
        notes: mappedPartner.rejection_reason || null,
        profiles: profile ? rowToSnakeCase<any>(profile) : { name: 'Delivery Rider', phone: 'N/A' },
        partner: mappedPartner,
        vehicle: extras.vehicle,
        documents: extras.documents,
        society: extras.society,
      });
    }

    return enrichedRequests.slice(offset, offset + limit);
  }
}
