import { supabase } from '../config/supabase';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { SettlementRepository } from '../repositories/settlement.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { ValidationError, NotFoundError } from '../utils/errors';
import { NotificationService } from './notification.service';
import type { PayoutBankDetails } from '../types/invoice';

export interface PayChefPayload {
  settlement_id: string;
  mode: 'AUTOMATIC' | 'MANUAL';
  manual_details?: {
    utr_number?: string;
    bank_reference?: string;
    payment_notes?: string;
  };
  actor_id?: string;
}

export class PayoutService {
  /**
   * Secure, idempotent "Pay Chef" workflow supporting automatic gateway payouts & manual UTR recording.
   */
  static async payChef(payload: PayChefPayload) {
    const { settlement_id, mode, manual_details, actor_id } = payload;

    // 1. Fetch Settlement with Kitchen details
    const { data: settlement, error } = await supabase
      .from('settlements')
      .select('*, kitchens(id, name, chef_name, chef_user_id, kitchen_info)')
      .eq('id', settlement_id)
      .single();

    if (error || !settlement) {
      throw new NotFoundError(`Settlement #${settlement_id} not found`);
    }

    const netPayable = Number(settlement.net_payable || 0);
    if (netPayable <= 0) {
      throw new ValidationError(`Settlement #${settlement_id} net payable amount (₹${netPayable}) must be greater than zero`);
    }

    const currentSt = (settlement.status || 'PENDING').toUpperCase();
    if (currentSt === 'PAID') {
      throw new ValidationError(`Settlement #${settlement_id} has already been paid`);
    }

    if (!['PENDING', 'GENERATED', 'PROCESSING', 'APPROVED', 'FAILED'].includes(currentSt)) {
      throw new ValidationError(`Settlement #${settlement_id} is in status ${currentSt} and cannot be processed for payout`);
    }

    const kitchen = settlement.kitchens as any;
    const chefUserId = kitchen?.chef_user_id;

    // 2. Validate Chef Bank Account Details
    // Previously this fell back to the literal string "Default Registered Bank
    // Account" and proceeded to mark the settlement PAID regardless — meaning
    // ops could "complete" a payout for a chef who never actually added a bank
    // account, with nothing recording that there was nowhere for the money to
    // go. Refuse instead, so a missing bank account surfaces as a blocker, not
    // a quietly wrong success.
    const bankDetails = KitchenRepository.getBankDetails(kitchen);
    if (!bankDetails) {
      throw new ValidationError(
        `Settlement #${settlement_id}: this kitchen has no saved bank account. The chef must add one before this payout can be processed.`
      );
    }

    let referenceId = '';
    let payoutStatus: 'COMPLETED' | 'FAILED' = 'COMPLETED';

    // 3. Mode Execution: Manual vs Automatic Gateway Payout
    if (mode === 'MANUAL') {
      referenceId = manual_details?.utr_number || manual_details?.bank_reference || `UTR_${Date.now()}`;
    } else {
      // Automatic Gateway Payout simulation (e.g. Razorpay Payouts API)
      referenceId = `rzp_payout_${Date.now()}_${settlement_id.substring(0, 6)}`;
    }

    // 4. Record Payout Request Record
    const payoutReq = await InvoiceRepository.requestPayout({
      kitchen_id: settlement.kitchen_id,
      amount: netPayable,
      bank_details: bankDetails,
    });

    await InvoiceRepository.updatePayoutStatus(payoutReq.id, 'COMPLETED', referenceId);

    // 5. Update Settlement Status to PAID
    const updatedSettlement = await SettlementRepository.updateStatus(settlement_id, 'PAID');

    // 6. Log Financial Audit
    await SettlementRepository.logFinancialAudit({
      action: `PAY_CHEF_${mode}_SETTLEMENT_${settlement_id.substring(0, 8)}_REF_${referenceId}`,
      old_balance: 0,
      new_balance: netPayable,
    });

    // 7. Dispatch Real-time Notification to Chef & Finance Admin
    try {
      if (chefUserId) {
        await NotificationService.sendNotification({
          profile_id: chefUserId,
          title: 'Payout Released! 💸',
          message: `Your earnings payout of ₹${netPayable.toLocaleString('en-IN')} for settlement period (${settlement.period_start} to ${settlement.period_end}) has been transferred (Ref: ${referenceId}).`,
          type: 'PAYMENT_UPDATE',
          entity_type: 'settlement',
          entity_id: settlement_id,
        });
      }
    } catch (err) {
      console.error('Failed to send payout notification to chef', err);
    }

    internalEventBus.emit(EVENTS.SETTLEMENT_COMPLETED, updatedSettlement);

    return {
      success: true,
      settlement: updatedSettlement,
      payout_reference: referenceId,
      amount_paid: netPayable,
      mode,
    };
  }

  /**
   * Retries a failed payout attempt
   */
  static async retryChefPayout(settlement_id: string, actor_id?: string) {
    const { data: settlement } = await supabase
      .from('settlements')
      .select('status')
      .eq('id', settlement_id)
      .single();

    if (!settlement) throw new NotFoundError(`Settlement #${settlement_id} not found`);

    // Reset status to APPROVED so Finance Admin can re-execute Pay Chef
    await SettlementRepository.updateStatus(settlement_id, 'APPROVED');

    await SettlementRepository.logFinancialAudit({
      action: `RETRY_CHEF_PAYOUT_SETTLEMENT_${settlement_id.substring(0, 8)}`,
      old_balance: 0,
      new_balance: 0,
    });

    return { success: true, settlement_id, status: 'APPROVED' };
  }

  /**
   * Fetches payout attempt history for a settlement
   */
  static async getPayoutHistoryForSettlement(settlement_id: string) {
    const { data: settlement } = await supabase
      .from('settlements')
      .select('kitchen_id, created_at, net_payable')
      .eq('id', settlement_id)
      .single();

    if (!settlement) return [];

    const payouts = await InvoiceRepository.getPayoutsByKitchen(settlement.kitchen_id);
    return (payouts || []).map((p, idx) => ({
      attempt_number: idx + 1,
      id: p.id,
      date: p.requested_at || p.processed_at,
      amount: p.amount || settlement.net_payable,
      status: p.status,
      reference_id: p.reference_id || `ref_${p.id.substring(0, 8)}`,
      bank_details: p.bank_details,
    }));
  }

  static async requestPayout(kitchen_id: string, chef_id: string, amount: number, bank_details: PayoutBankDetails) {
    const request = await InvoiceRepository.requestPayout({
      kitchen_id, amount, bank_details
    });

    internalEventBus.emit(EVENTS.PAYOUT_REQUESTED, request);
    return request;
  }

  static async updatePayoutStatus(id: string, status: any, reference_id?: string) {
    const updated = await InvoiceRepository.updatePayoutStatus(id, status, reference_id);

    if (status === 'COMPLETED') {
      internalEventBus.emit(EVENTS.SETTLEMENT_COMPLETED, updated);
    } else if (status === 'APPROVED') {
      internalEventBus.emit(EVENTS.SETTLEMENT_APPROVED, updated);
    }

    return updated;
  }

  static async getPayouts(kitchen_id: string) {
    return InvoiceRepository.getPayoutsByKitchen(kitchen_id);
  }
}
