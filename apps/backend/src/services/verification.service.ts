import { supabase } from '../config/supabase';
import { VerificationRepository } from '../repositories/verification.repository';
import { CrmService } from './crm.service';
import { VerificationStatus } from '../types/verification';

export class VerificationService {
  static async updateStatus(admin_id: string, id: string, status: VerificationStatus, notes?: string) {
    // 1. Try to find a kitchen verification request. Previously checked
    // existence via the old Supabase client (`config/supabase`) but wrote
    // the actual update via VerificationRepository/Drizzle against local
    // Postgres — two different databases once they diverge, which is the
    // entire premise of this migration. A kitchen verification row that
    // exists in Drizzle's Postgres but not (or differently) in Supabase
    // would always 404 here, even though it's the real, current record.
    const kitchenVerification = await VerificationRepository.findById(id);

    if (kitchenVerification) {
      const verification = await VerificationRepository.updateStatus(id, status, admin_id, notes);
      await CrmService.logAction(admin_id, `VERIFICATION_STATUS_${status}`, 'kitchen_verification', id, notes);
      return verification;
    }

    // 2. Try to find a partner verification request by id or partner_id
    let { data: partnerReq } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!partnerReq) {
      const { data: byPartner } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('partner_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      partnerReq = byPartner;
    }

    if (partnerReq) {
      const targetStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      
      // Clean up older rows with the same partner_id & targetStatus to respect unique_pending_request constraint
      try {
        await supabase
          .from('verification_requests')
          .delete()
          .eq('partner_id', partnerReq.partner_id)
          .eq('status', targetStatus)
          .neq('id', partnerReq.id);
      } catch (e: any) {
        console.warn('[VerificationService] Clean older verification_requests failed:', e.message || e);
      }

      // Update verification_requests status
      const { error: reqErr } = await supabase
        .from('verification_requests')
        .update({ status: targetStatus, notes, updated_at: new Date().toISOString() })
        .eq('id', partnerReq.id);
      if (reqErr) console.warn('[VerificationService] Update verification_requests failed:', reqErr.message);

      // Update partner kyc_status & partner_documents status
      const { CrmRepository } = require('../repositories/crm.repository');
      const updatedPartner = await CrmRepository.updatePartnerKycStatus(partnerReq.partner_id, targetStatus, notes);

      // Log verification history
      try {
        await supabase
          .from('verification_history')
          .insert({
            request_id: partnerReq.id,
            status: targetStatus,
            notes,
            performed_by: admin_id
          });
      } catch (e: any) {
        console.warn('[VerificationService] Insert verification_history failed:', e.message || e);
      }

      // Write partner verification log
      try {
        const { PartnerRepository } = require('../repositories/partner.repository');
        if (PartnerRepository && PartnerRepository.insertVerificationLog) {
          await PartnerRepository.insertVerificationLog(partnerReq.partner_id, targetStatus);
        }
      } catch (e: any) {
        console.warn('[VerificationService] Partner verification log failed:', e.message || e);
      }

      // Log admin CRM action
      try {
        await CrmService.logAction(admin_id, `PARTNER_VERIFICATION_STATUS_${targetStatus}`, 'partner_verification', partnerReq.id, notes);
      } catch (e: any) {
        console.warn('[VerificationService] Log action failed:', e.message || e);
      }

      // Create notification row for realtime update in delivery app
      if (updatedPartner && updatedPartner.user_id) {
        try {
          const { error: notifErr } = await supabase
            .from('notifications')
            .insert({
              user_id: updatedPartner.user_id,
              title: targetStatus === 'APPROVED' ? 'KYC Verified' : 'KYC Rejected',
              message: targetStatus === 'APPROVED' 
                ? 'Your KYC documents have been verified successfully. You can now accept deliveries!' 
                : `Your KYC documents were rejected: ${notes || 'Verification failed'}`,
              type: 'KYC_STATUS',
            });
          if (notifErr) console.warn('[VerificationService] Notification insert failed:', notifErr.message);
        } catch (e: any) {
          console.warn('[VerificationService] Create notification failed:', e.message || e);
        }
      }

      return { id: partnerReq.id, status: targetStatus, partner_id: partnerReq.partner_id };
    }

    // 3. Fallback: try direct delivery_partner update by partner_id
    const { data: directPartner } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (directPartner) {
      const targetStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      const { CrmRepository } = require('../repositories/crm.repository');
      const updatedPartner = await CrmRepository.updatePartnerKycStatus(id, targetStatus, notes);

      if (updatedPartner && updatedPartner.user_id) {
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: updatedPartner.user_id,
              title: targetStatus === 'APPROVED' ? 'KYC Verified' : 'KYC Rejected',
              message: targetStatus === 'APPROVED' 
                ? 'Your KYC documents have been verified successfully. You can now accept deliveries!' 
                : `Your KYC documents were rejected: ${notes || 'Verification failed'}`,
              type: 'KYC_STATUS',
            });
        } catch (e: any) {}
      }

      return { id, status: targetStatus, partner_id: id };
    }

    throw new Error('Verification request not found');
  }

  static async getPendingVerifications(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const kitchens = await VerificationRepository.getPendingVerifications(limit, offset);
    const partners = await VerificationRepository.getPendingPartnerVerifications(limit, offset);
    return [...kitchens, ...partners];
  }
}
