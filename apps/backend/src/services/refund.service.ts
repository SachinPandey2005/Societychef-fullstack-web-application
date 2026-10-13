import { supabase } from '../config/supabase';
import { LedgerService } from './ledger.service';
import { CrmRepository } from '../repositories/crm.repository';
import { NotificationService } from './notification.service';
import { RefundRepository } from '../repositories/refund.repository';
import { WalletService } from './wallet.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { RefundRecord, RefundType, FinancialAdjustment, AdjustmentType } from '../types/refund';

export class RefundService {
  static async requestRefund(params: {
    order_id: string;
    amount?: number;
    reason: string;
    type?: RefundType;
    requested_by?: string;
  }): Promise<RefundRecord> {
    const { order_id, amount, reason, type = 'FULL', requested_by } = params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, kitchens(id, chef_name)')
      .eq('id', order_id)
      .single();

    if (error || !order) throw new NotFoundError(`Order #${order_id} not found`);

    const grandTotal = Number(order.grand_total || order.total_paid || 0);
    const refundAmount = amount ? Math.min(amount, grandTotal) : grandTotal;

    const refund = await RefundRepository.createRefund({
      order_id,
      customer_id: order.customer_id,
      kitchen_id: order.kitchen_id,
      payment_id: order.razorpay_payment_id || order.id,
      amount: refundAmount,
      type,
      reason,
      status: 'PENDING',
      requested_by,
    });

    await CrmRepository.createAuditLog({
      actor_id: requested_by || 'SYSTEM',
      action: 'REQUEST_REFUND',
      target_entity: 'refund',
      target_entity_id: refund.id,
      new_value: refund,
      reason: `Refund requested [${type}] - ₹${refundAmount}: ${reason}`,
    });

    // Notify Finance Admins
    try {
      if (refundAmount > 2000) {
        // High-value refund alert
        await NotificationService.sendNotification({
          profile_id: requested_by || 'SYSTEM',
          title: 'High-Value Refund Requested ⚠️',
          message: `High-value refund of ₹${refundAmount} for Order #${order_id.substring(0, 8)} requires approval.`,
          type: 'FINANCE_ALERT',
        });
      }
    } catch (e) {
      console.warn('Failed to send high-value refund notification:', e);
    }

    return refund;
  }

  static async approveRefund(refund_id: string, approver_id: string): Promise<RefundRecord> {
    const refund = await RefundRepository.findById(refund_id);
    if (!refund) throw new NotFoundError(`Refund #${refund_id} not found`);

    const updated = await RefundRepository.updateRefundStatus(refund_id, 'APPROVED', approver_id);

    await CrmRepository.createAuditLog({
      actor_id: approver_id,
      action: 'APPROVE_REFUND',
      target_entity: 'refund',
      target_entity_id: refund_id,
      previous_value: { status: refund.status },
      new_value: { status: 'APPROVED' },
      reason: `Refund #${refund_id} approved by Finance Admin`,
    });

    // Automatically process approved refund
    return this.processRefund({
      order_id: refund.order_id,
      amount: refund.amount,
      reason: refund.reason,
      type: refund.type,
      actor_id: approver_id,
      refund_id: refund.id,
    });
  }

  static async processRefund(params: {
    order_id: string;
    amount?: number;
    reason: string;
    type?: RefundType;
    actor_id?: string;
    refund_id?: string;
  }) {
    const { order_id, amount, reason, type = 'FULL', actor_id, refund_id } = params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, kitchens(id, chef_user_id, chef_name)')
      .eq('id', order_id)
      .single();

    if (error || !order) throw new NotFoundError(`Order #${order_id} not found`);

    // Idempotency guard: a retried/duplicate call for an order that's
    // already been refunded must not debit the chef wallet or write a
    // second refund/ledger/adjustment record for the same order.
    if (order.payment_status === 'REFUNDED') {
      throw new ValidationError(`Order #${order_id} has already been refunded`);
    }

    const grandTotal = Number(order.grand_total || order.total_paid || 0);
    const refundAmount = amount ? Math.min(amount, grandTotal) : grandTotal;

    let gatewayRefundId = `cf_ref_${Date.now().toString().substring(5)}`;
    try {
      const { CashfreeService } = require('./cashfree.service');
      const cfRefund = await CashfreeService.refundCashfreePayment(order_id, refundAmount, reason).catch(() => null);
      if (cfRefund?.cf_refund_id) {
        gatewayRefundId = cfRefund.cf_refund_id;
      }
    } catch {
      // fallback to generated reference
    }

    // Update order status to CANCELLED / REFUNDED
    await supabase
      .from('orders')
      .update({
        status: 'CANCELLED',
        payment_status: 'REFUNDED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    // Save or update refund record in DB
    let refundRecord: RefundRecord;
    if (refund_id) {
      refundRecord = await RefundRepository.updateRefundStatus(refund_id, 'COMPLETED', actor_id, gatewayRefundId);
    } else {
      refundRecord = await RefundRepository.createRefund({
        order_id,
        customer_id: order.customer_id,
        kitchen_id: order.kitchen_id,
        payment_id: order.razorpay_payment_id || order.id,
        amount: refundAmount,
        type,
        reason,
        status: 'COMPLETED',
        processed_by: actor_id,
        gateway_refund_id: gatewayRefundId,
      });
    }

    // Adjust Chef Wallet Ledger (Debit Chef for earnings reversal if previously credited)
    const kitchen = order.kitchens as any;
    if (kitchen?.chef_user_id) {
      try {
        const netChefEarnings = Number(order.net_chef_earnings || (grandTotal * 0.85));
        if (netChefEarnings > 0) {
          await WalletService.debitWallet(
            kitchen.chef_user_id,
            'CHEF',
            netChefEarnings,
            'REFUND_ADJUSTMENT',
            `Deduction for refunded Order #${order_id.substring(0, 8)}`,
            order_id
          );
        }
      } catch (err) {
        console.warn('Chef wallet debit failed during refund processing:', err);
      }
    }

    // Credit Customer Wallet if offline/wallet refund requested
    if (order.customer_id && type === 'MANUAL') {
      try {
        await WalletService.creditWallet(
          order.customer_id,
          'CONSUMER',
          refundAmount,
          'REFUND_CREDIT',
          `Manual refund for Order #${order_id.substring(0, 8)}`,
          order_id
        );
      } catch (err) {
        console.warn('Customer wallet credit failed during refund processing:', err);
      }
    }

    // Record Centralized Double-Entry Ledger Entry
    await LedgerService.recordLedgerEntry({
      reference_id: order_id,
      source_module: 'REFUND',
      event_type: 'REFUND_PROCESSED',
      amount: refundAmount,
      currency: 'INR',
      status: 'POSTED',
      actor_id,
    });

    // Write Financial Adjustment Record
    await RefundRepository.createFinancialAdjustment({
      adjustment_type: 'REFUND_ADJUSTMENT',
      target_type: 'CHEF',
      target_id: kitchen?.id || order.kitchen_id,
      amount: refundAmount,
      entry_type: 'DEBIT',
      reason: `Refund processed [${type}] for Order #${order_id.substring(0, 8)}: ${reason}`,
      requested_by: actor_id,
      approved_by: actor_id,
      reference_entity_type: 'order',
      reference_entity_id: order_id,
      supporting_notes: `Gateway Ref: ${gatewayRefundId}`,
      status: 'APPROVED',
    });

    // Write Immutable Audit Log
    await CrmRepository.createAuditLog({
      actor_id: actor_id || 'SYSTEM_FINANCE',
      action: 'PROCESS_REFUND',
      target_entity: 'order',
      target_entity_id: order_id,
      previous_value: { payment_status: order.payment_status, status: order.status },
      new_value: { payment_status: 'REFUNDED', status: 'CANCELLED', refund_amount: refundAmount, gateway_refund_id: gatewayRefundId },
      reason: `[${type}] ${reason}`,
    });

    // Dispatch Notifications to Customer and Chef
    try {
      if (order.customer_id) {
        await NotificationService.sendNotification({
          profile_id: order.customer_id,
          title: 'Refund Completed 💰',
          message: `Your refund of ₹${refundAmount} for Order #${order_id.substring(0, 8)} has been processed. Ref: ${gatewayRefundId}`,
          type: 'PAYMENT_UPDATE',
        });
      }

      if (kitchen?.id) {
        await NotificationService.sendNotification({
          profile_id: kitchen.id,
          title: 'Order Refund Notice ℹ️',
          message: `Order #${order_id.substring(0, 8)} was refunded (₹${refundAmount}). Settlement & wallet adjusted accordingly.`,
          type: 'PAYMENT_UPDATE',
        });
      }
    } catch (e) {
      console.error('Failed to dispatch refund notifications', e);
    }

    return {
      ...refundRecord,
      refund_id: refundRecord.id,
      order_id,
      amount: refundAmount,
      type,
      status: 'COMPLETED' as const,
      gateway_refund_id: gatewayRefundId,
      processed_at: new Date().toISOString(),
    };
  }


  static async getRefunds(filters?: any): Promise<RefundRecord[]> {
    return RefundRepository.getRefunds(50, 0, filters);
  }

  static async getRefundById(id: string): Promise<RefundRecord | null> {
    return RefundRepository.findById(id);
  }

  // --- Financial Adjustments ---
  static async createFinancialAdjustment(params: {
    adjustment_type: AdjustmentType;
    target_type: 'CHEF' | 'CUSTOMER' | 'PLATFORM';
    target_id: string;
    amount: number;
    entry_type: 'CREDIT' | 'DEBIT';
    reason: string;
    requested_by?: string;
    approved_by?: string;
    reference_entity_type?: string;
    reference_entity_id?: string;
    supporting_notes?: string;
  }): Promise<FinancialAdjustment> {
    const {
      adjustment_type,
      target_type,
      target_id,
      amount,
      entry_type,
      reason,
      requested_by,
      approved_by,
      reference_entity_type,
      reference_entity_id,
      supporting_notes,
    } = params;

    const adjustment = await RefundRepository.createFinancialAdjustment({
      adjustment_type,
      target_type,
      target_id,
      amount,
      entry_type,
      reason,
      requested_by,
      approved_by: approved_by || requested_by,
      reference_entity_type,
      reference_entity_id,
      supporting_notes,
      status: 'APPROVED',
    });

    // Execute wallet ledger update if target is Chef or Customer
    try {
      if (target_type === 'CHEF') {
        if (entry_type === 'CREDIT') {
          await WalletService.creditWallet(target_id, 'CHEF', amount, adjustment_type, reason, reference_entity_id);
        } else {
          await WalletService.debitWallet(target_id, 'CHEF', amount, adjustment_type, reason, reference_entity_id);
        }
      } else if (target_type === 'CUSTOMER') {
        if (entry_type === 'CREDIT') {
          await WalletService.creditWallet(target_id, 'CONSUMER', amount, adjustment_type, reason, reference_entity_id);
        } else {
          await WalletService.debitWallet(target_id, 'CONSUMER', amount, adjustment_type, reason, reference_entity_id);
        }
      }
    } catch (e) {
      console.warn('Wallet ledger update failed during financial adjustment execution:', e);
    }

    // Write audit log
    await CrmRepository.createAuditLog({
      actor_id: requested_by || 'SYSTEM',
      action: `CREATE_FINANCIAL_ADJUSTMENT_${entry_type}`,
      target_entity: 'financial_adjustment',
      target_entity_id: adjustment.id,
      new_value: adjustment,
      reason: `[${adjustment_type}] ${reason}`,
    });

    return adjustment;
  }

  static async getFinancialAdjustments(): Promise<FinancialAdjustment[]> {
    return RefundRepository.getFinancialAdjustments(50, 0);
  }
}
