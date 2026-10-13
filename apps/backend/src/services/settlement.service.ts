import { SettlementRepository } from '../repositories/settlement.repository';
import { SettlementStatus, SettlementFilterParams } from '../types/settlement';
import { CommissionEngine } from './commission.engine';
import { supabase } from '../config/supabase';
import { OrderRepository } from '../repositories/order.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { ValidationError, NotFoundError } from '../utils/errors';

export class SettlementService {
  /**
   * Automatic Commission & Settlement Processing Triggered on Successful Customer Payment.
   * Strict Idempotency: Re-triggering for same payment_id updates existing settlement row.
   */
  static async processAutomaticOrderSettlement(order_id: string, payment_id: string) {
    const existingSettlement = await SettlementRepository.findSettlementByTransactionId(payment_id);

    // Previously queried Supabase's own Postgres directly — orders live in
    // Drizzle/local Postgres since Phase 1, so this could never find an
    // order placed through any real, converted checkout endpoint. Automatic
    // settlement had been silently failing (caught by the caller's
    // try/catch) for every real paid order since then.
    const order = await OrderRepository.getOrderById(order_id);
    if (!order) {
      throw new Error(`Order #${order_id} not found for settlement processing`);
    }

    const kitchenId = order.kitchen_id;
    const kitchen = kitchenId ? await KitchenRepository.findById(kitchenId) : null;
    const societyId = kitchen?.society_id;
    const grandTotal = Number(order.grand_total || (order as any).item_total || 0);
    const deliveryFee = Number((order as any).delivery_fee || 0);

    const fin = await CommissionEngine.calculateOrderFinancials(
      order_id,
      grandTotal,
      deliveryFee,
      kitchenId,
      societyId
    );

    await OrderRepository.updatePaymentGatewayFields(order_id, {
      paymentStatus: 'paid',
    });
    await OrderRepository.updateFinancials(order_id, {
      platformCommission: fin.platform_commission,
      netChefEarnings: fin.net_chef_earnings,
      taxAmount: fin.tax_amount,
    });

    const todayDate = new Date().toISOString().split('T')[0];
    const gatewayFee = Number((grandTotal * 0.02).toFixed(2));

    let settlement;
    if (existingSettlement) {
      settlement = await SettlementRepository.updateSettlementRecord(existingSettlement.id, {
        total_sales: grandTotal,
        platform_commission: fin.platform_commission,
        gateway_fees: gatewayFee,
        taxes: fin.tax_amount,
        net_payable: fin.net_chef_earnings,
        status: existingSettlement.status || 'PENDING',
      });
    } else {
      settlement = await SettlementRepository.createSettlement({
        kitchen_id: kitchenId,
        period_start: todayDate,
        period_end: todayDate,
        total_sales: grandTotal,
        platform_commission: fin.platform_commission,
        gateway_fees: gatewayFee,
        taxes: fin.tax_amount,
        refund_adjustments: 0,
        net_payable: fin.net_chef_earnings,
        held_transaction_id: payment_id,
        status: 'PENDING',
      });
    }

    await SettlementRepository.logFinancialAudit({
      action: `AUTOMATIC_COMMISSION_SETTLEMENT_ORDER_${order_id.substring(0, 8)}`,
      old_balance: 0,
      new_balance: fin.net_chef_earnings,
    });

    return {
      order_id,
      settlement_id: settlement.id,
      financials: fin,
      settlement,
    };
  }

  static async getSettlementsExtended(params: SettlementFilterParams) {
    return SettlementRepository.getSettlementsExtended(params);
  }

  static async getSettlementSummaryMetrics() {
    return SettlementRepository.getSettlementSummaryMetrics();
  }

  static async getSettlementDetails(id: string) {
    return SettlementRepository.getSettlementDetailsWithOrders(id);
  }

  static async updateStatus(id: string, newStatus: SettlementStatus, actor_id?: string) {
    const { data: current } = await supabase.from('settlements').select('status').eq('id', id).single();
    if (!current) throw new NotFoundError(`Settlement #${id} not found`);

    const validTransitions: Record<string, string[]> = {
      'PENDING': ['GENERATED', 'PROCESSING', 'APPROVED', 'CANCELLED'],
      'GENERATED': ['PROCESSING', 'APPROVED', 'PAID', 'CANCELLED'],
      'PROCESSING': ['PAID', 'FAILED', 'CANCELLED'],
      'APPROVED': ['PROCESSING', 'PAID', 'FAILED', 'CANCELLED'],
      'PAID': [],
      'FAILED': ['PROCESSING', 'PAID'],
      'CANCELLED': [],
    };

    const currentSt = (current.status || 'PENDING').toUpperCase();
    if (!validTransitions[currentSt]?.includes(newStatus.toUpperCase())) {
      throw new ValidationError(`Invalid settlement lifecycle transition from ${currentSt} to ${newStatus}`);
    }

    const updated = await SettlementRepository.updateStatus(id, newStatus);
    await SettlementRepository.logFinancialAudit({
      action: `UPDATE_SETTLEMENT_STATUS_${newStatus}`,
      old_balance: 0,
      new_balance: 1,
    });

    return updated;
  }

  static async bulkUpdateStatus(ids: string[], status: SettlementStatus, actor_id?: string) {
    if (!ids || ids.length === 0) throw new ValidationError('No settlement IDs provided for bulk update');
    return SettlementRepository.bulkUpdateStatus(ids, status, actor_id);
  }

  static async bulkGenerateSettlements(period_start: string, period_end: string) {
    const { data: kitchens } = await supabase.from('kitchens').select('id, name');
    const generated: any[] = [];

    for (const k of kitchens || []) {
      try {
        const set = await this.generateSettlement(k.id, period_start, period_end);
        generated.push(set);
      } catch (e) {
        // Skip kitchens with 0 sales in period
      }
    }

    return { generated_count: generated.length, settlements: generated };
  }

  static async generateSettlement(kitchen_id: string, period_start: string, period_end: string) {
    const { data: orders } = await supabase
      .from('orders')
      .select('grand_total, platform_commission, net_chef_earnings, tax_amount')
      .eq('kitchen_id', kitchen_id)
      .gte('created_at', period_start)
      .lte('created_at', period_end + 'T23:59:59.999Z');

    const total_sales = orders?.reduce((sum: number, o: any) => sum + Number(o.grand_total || 0), 0) || 0;
    if (total_sales === 0) {
      throw new ValidationError(`No delivered sales found for kitchen #${kitchen_id} in selected period`);
    }

    const platform_commission = orders?.reduce((sum: number, o: any) => sum + Number(o.platform_commission || 0), 0) || Math.floor(total_sales * 0.10);
    const gateway_fees = Math.floor(total_sales * 0.02);
    const taxes = orders?.reduce((sum: number, o: any) => sum + Number(o.tax_amount || 0), 0) || 0;
    const refund_adjustments = 0;
    const net_payable = orders?.reduce((sum: number, o: any) => sum + Number(o.net_chef_earnings || 0), 0) || (total_sales - platform_commission - gateway_fees);

    return SettlementRepository.createSettlement({
      kitchen_id,
      period_start,
      period_end,
      total_sales,
      platform_commission,
      gateway_fees,
      taxes,
      refund_adjustments,
      net_payable,
      status: 'PENDING',
    });
  }

  static async getSettlementsByKitchen(kitchen_id: string) {
    return SettlementRepository.getSettlementsByKitchen(kitchen_id);
  }

  static async getPendingSettlements() {
    return SettlementRepository.getPendingSettlements();
  }

  static async exportSettlementsData(params: SettlementFilterParams) {
    const settlements = await SettlementRepository.getSettlementsExtended(params);
    const rows = settlements.map(s => ({
      'Settlement ID': s.id,
      'Chef Name': s.kitchens?.chef_name || 'N/A',
      'Kitchen': s.kitchens?.name || 'N/A',
      'Society': s.kitchens?.societies?.name || 'N/A',
      'Period Start': s.period_start,
      'Period End': s.period_end,
      'Gross Sales': s.total_sales,
      'Platform Commission': s.platform_commission,
      'Taxes': s.taxes,
      'Gateway Fees': s.gateway_fees,
      'Net Payable': s.net_payable,
      'Status': s.status,
      'Created Date': s.created_at,
    }));

    return rows;
  }

  /**
   * Module 3: Settlement Reversal
   * - If not yet paid: reverse settlement automatically -> set status to CANCELLED.
   * - If payout already completed: create a DEBIT financial adjustment entry instead of deleting historical record.
   */
  static async reverseSettlement(settlement_id: string, reason: string, actor_id?: string) {
    const { data: settlement, error } = await supabase
      .from('settlements')
      .select('*, kitchens(id, chef_user_id, chef_name)')
      .eq('id', settlement_id)
      .single();

    if (error || !settlement) {
      throw new NotFoundError(`Settlement #${settlement_id} not found`);
    }

    const currentStatus = (settlement.status || 'PENDING').toUpperCase();
    const netPayable = Number(settlement.net_payable || 0);
    const kitchen = settlement.kitchens as any;

    if (currentStatus === 'CANCELLED') {
      throw new ValidationError(`Settlement #${settlement_id} is already cancelled`);
    }

    if (currentStatus === 'PAID') {
      // Payout already completed: Create an adjustment entry instead of deleting historical record
      const { RefundService } = require('./refund.service');
      const adjustment = await RefundService.createFinancialAdjustment({
        adjustment_type: 'SETTLEMENT_REVERSAL',
        target_type: 'CHEF',
        target_id: kitchen?.id || settlement.kitchen_id,
        amount: netPayable,
        entry_type: 'DEBIT',
        reason: `Settlement Reversal for PAID Settlement #${settlement_id.substring(0, 8)}: ${reason}`,
        requested_by: actor_id,
        approved_by: actor_id,
        reference_entity_type: 'settlement',
        reference_entity_id: settlement_id,
        supporting_notes: `Original Settlement Net Payable: ₹${netPayable}`,
      });

      await SettlementRepository.logFinancialAudit({
        action: `SETTLEMENT_REVERSAL_PAID_SETTLEMENT_${settlement_id.substring(0, 8)}`,
        old_balance: netPayable,
        new_balance: 0,
      });

      return {
        settlement_id,
        type: 'ADJUSTMENT_ENTRY_CREATED',
        message: 'Settlement was already PAID. Settlement reversal adjustment entry created to adjust chef balance while preserving historical record.',
        adjustment,
      };
    }

    // Not yet paid: update status to CANCELLED
    const updated = await SettlementRepository.updateStatus(settlement_id, 'CANCELLED');

    // Debit Chef Wallet if pending credit was held
    if (kitchen?.chef_user_id) {
      try {
        const { WalletService } = require('./wallet.service');
        await WalletService.debitWallet(
          kitchen.chef_user_id,
          'CHEF',
          netPayable,
          'SETTLEMENT_REVERSAL',
          `Reversal of unpaid Settlement #${settlement_id.substring(0, 8)}`,
          settlement_id
        );
      } catch (e) {
        console.warn('Wallet adjustment skipped or failed during settlement reversal:', e);
      }
    }

    await SettlementRepository.logFinancialAudit({
      action: `SETTLEMENT_REVERSAL_CANCELLED_${settlement_id.substring(0, 8)}`,
      old_balance: netPayable,
      new_balance: 0,
    });

    return {
      settlement_id,
      type: 'REVERSED_AUTOMATICALLY',
      message: `Unpaid settlement status updated from ${currentStatus} to CANCELLED.`,
      settlement: updated,
    };
  }
}

