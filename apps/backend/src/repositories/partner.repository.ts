import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  deliveryPartners,
  partnerDocuments,
  partnerVehicles,
  partnerBankAccounts,
  partnerEmergencyContacts,
  partnerSocietyAssignments,
  partnerVerificationLogs,
  verificationRequests,
  verificationHistory,
  profiles,
  societies,
} from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';

// This file maps cleanly onto the real schema (unlike most others converted
// so far) — all tables/columns here are confirmed real. The four
// upsertX methods that target a column with a real UNIQUE constraint
// (partner_vehicles/partner_bank_accounts/partner_emergency_contacts/
// partner_society_assignments, all UNIQUE on partner_id) now use an atomic
// onConflictDoUpdate instead of a check-then-update/insert, which also
// closes a small race window the original had. partner_documents has no
// such constraint (a partner can have several document types), so it keeps
// the manual check pattern.

export class PartnerRepository {
  static async getOrCreatePartner(userId: string): Promise<any> {
    const profileRows = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (profileRows[0]?.role === 'consumer') {
      await db.update(profiles).set({ role: 'DELIVERY_PARTNER' }).where(eq(profiles.id, userId));
    }

    const existing = await db.select().from(deliveryPartners).where(eq(deliveryPartners.userId, userId)).limit(1);
    if (existing[0]) return rowToSnakeCase<any>(existing[0]);

    const created = await db
      .insert(deliveryPartners)
      .values({ userId, vehicleType: 'SCOOTER', status: 'OFFLINE', kycStatus: 'PENDING', isOnline: false })
      .returning();
    const newPartner = rowToSnakeCase<any>(created[0]);

    await db.update(profiles).set({ role: 'DELIVERY_PARTNER' }).where(eq(profiles.id, userId));
    await this.createOrUpdateVerificationRequest(newPartner.id).catch(() => {});

    return newPartner;
  }

  static async updatePartner(partnerId: string, details: any): Promise<any> {
    if (!details || Object.keys(details).length === 0) {
      const rows = await db.select().from(deliveryPartners).where(eq(deliveryPartners.id, partnerId)).limit(1);
      if (!rows[0]) throw new Error(`Delivery partner ${partnerId} not found`);
      return rowToSnakeCase<any>(rows[0]);
    }

    const rows = await db.update(deliveryPartners).set(toCamelCaseInput(details)).where(eq(deliveryPartners.id, partnerId)).returning();
    if (!rows[0]) throw new Error(`Delivery partner ${partnerId} not found`);
    return rowToSnakeCase<any>(rows[0]);
  }

  static async upsertDocument(partnerId: string, doc: any): Promise<any> {
    const existing = await db
      .select({ id: partnerDocuments.id })
      .from(partnerDocuments)
      .where(and(eq(partnerDocuments.partnerId, partnerId), eq(partnerDocuments.documentType, doc.document_type)))
      .limit(1);

    if (existing[0]) {
      const rows = await db
        .update(partnerDocuments)
        .set({
          documentUrl: doc.document_url,
          status: 'PENDING',
          expiryDate: doc.expiry_date || null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(partnerDocuments.id, existing[0].id))
        .returning();
      return rowToSnakeCase<any>(rows[0]);
    }

    const rows = await db
      .insert(partnerDocuments)
      .values({
        partnerId,
        documentType: doc.document_type,
        documentUrl: doc.document_url,
        status: 'PENDING',
        expiryDate: doc.expiry_date || null,
      })
      .returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async getDocuments(partnerId: string): Promise<any[]> {
    const rows = await db
      .select()
      .from(partnerDocuments)
      .where(eq(partnerDocuments.partnerId, partnerId))
      .orderBy(desc(partnerDocuments.createdAt));
    return rowsToSnakeCase<any>(rows);
  }

  static async upsertVehicle(partnerId: string, vehicle: any): Promise<any> {
    const values = {
      vehicleType: vehicle.vehicle_type,
      vehicleNumber: vehicle.vehicle_number,
      rcUrl: vehicle.rc_url,
      insuranceUrl: vehicle.insurance_url,
      pucUrl: vehicle.puc_url || null,
      photoUrl: vehicle.photo_url || null,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };
    const rows = await db
      .insert(partnerVehicles)
      .values({ partnerId, ...values })
      .onConflictDoUpdate({ target: partnerVehicles.partnerId, set: values })
      .returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async getVehicle(partnerId: string): Promise<any> {
    const rows = await db.select().from(partnerVehicles).where(eq(partnerVehicles.partnerId, partnerId)).limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async upsertBank(partnerId: string, bank: any): Promise<any> {
    const values = {
      holderName: bank.holder_name,
      bankName: bank.bank_name,
      accountNumber: bank.account_number,
      ifscCode: bank.ifsc_code,
      upiId: bank.upi_id || null,
      chequeUrl: bank.cheque_url,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };
    const rows = await db
      .insert(partnerBankAccounts)
      .values({ partnerId, ...values })
      .onConflictDoUpdate({ target: partnerBankAccounts.partnerId, set: values })
      .returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async getBank(partnerId: string): Promise<any> {
    const rows = await db.select().from(partnerBankAccounts).where(eq(partnerBankAccounts.partnerId, partnerId)).limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async upsertEmergencyContact(partnerId: string, contact: any): Promise<any> {
    const values = {
      primaryName: contact.primary_name,
      primaryPhone: contact.primary_phone,
      primaryRelationship: contact.primary_relationship,
      secondaryName: contact.secondary_name || null,
      secondaryPhone: contact.secondary_phone || null,
      secondaryRelationship: contact.secondary_relationship || null,
    };
    const rows = await db
      .insert(partnerEmergencyContacts)
      .values({ partnerId, ...values })
      .onConflictDoUpdate({ target: partnerEmergencyContacts.partnerId, set: values })
      .returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async getEmergencyContact(partnerId: string): Promise<any> {
    const rows = await db.select().from(partnerEmergencyContacts).where(eq(partnerEmergencyContacts.partnerId, partnerId)).limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async getSocietyAssignment(partnerId: string): Promise<any> {
    const rows = await db
      .select()
      .from(partnerSocietyAssignments)
      .leftJoin(societies, eq(partnerSocietyAssignments.societyId, societies.id))
      .where(eq(partnerSocietyAssignments.partnerId, partnerId))
      .limit(1);

    if (rows[0]) {
      const { partner_society_assignments: assignment, societies: society } = rows[0];
      return { ...rowToSnakeCase<any>(assignment), societies: society ? rowToSnakeCase<any>(society) : null };
    }

    // Auto-assign to first available society if none assigned
    const defaultSociety = await db.select().from(societies).limit(1);
    if (!defaultSociety[0]) return null;

    const inserted = await db
      .insert(partnerSocietyAssignments)
      .values({
        partnerId,
        societyId: defaultSociety[0].id,
        towerCoverage: ['A', 'B', 'C'],
        deliveryRadiusKm: 2.0,
        workingZone: 'North',
        shiftTimingStart: '08:00',
        shiftTimingEnd: '20:00',
      })
      .returning();

    return { ...rowToSnakeCase<any>(inserted[0]), societies: rowToSnakeCase<any>(defaultSociety[0]) };
  }

  static async insertVerificationLog(partnerId: string, action: string): Promise<any> {
    const rows = await db.insert(partnerVerificationLogs).values({ partnerId, action }).returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async createOrUpdateVerificationRequest(partnerId: string): Promise<any> {
    const existing = await db
      .select()
      .from(verificationRequests)
      .where(and(eq(verificationRequests.partnerId, partnerId), eq(verificationRequests.status, 'PENDING')))
      .limit(1);

    let request = existing[0] ? rowToSnakeCase<any>(existing[0]) : null;
    if (!request) {
      const created = await db.insert(verificationRequests).values({ partnerId, status: 'PENDING' }).returning();
      if (created[0]) request = rowToSnakeCase<any>(created[0]);
    }

    if (request?.id) {
      try {
        await db.insert(verificationHistory).values({
          requestId: request.id,
          status: 'PENDING',
          notes: 'KYC documents submitted for review',
        });
      } catch (hErr: any) {
        console.warn('[PartnerRepository] Verification history insertion warning:', hErr?.message || hErr);
      }
    }

    return request;
  }
}
