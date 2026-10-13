import { OrderRepository } from '../repositories/order.repository';
import { CommissionEngine } from './commission.engine';
import { TaxEngine } from './tax.engine';
import { TransactionEngine } from './transaction.engine';
import { WalletService } from './wallet.service';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { supabase } from '../config/supabase';
import { KitchenService } from './kitchen.service';

export class EarningsEngine {
  static async processOrderEarnings(order: any) {
    // 1. Double check order is delivered and hasn't been processed
    if (order.status !== 'DELIVERED') return;
    
    // Simplification: Check if already processed (could check if net_chef_earnings > 0 in DB)
    if (order.net_chef_earnings > 0) return; 

    // 2. Fetch Rules
    const commissionRule = await CommissionEngine.getCommissionRule(order.kitchen_id);
    const taxRule = await TaxEngine.getTaxRule(); // assuming default region for now

    // 3. Calculate
    const grossAmount = order.grand_total; // assuming this is what customer paid minus delivery, or including it. Let's assume grand_total includes delivery.
    // In a real app, delivery_fee should be separated. Let's extract from pricing if possible.
    const deliveryFee = order.delivery_fee || 0;
    const taxableAmount = grossAmount - deliveryFee; // roughly

    const taxAmount = TaxEngine.calculateTax(taxableAmount, taxRule);
    const platformCommission = CommissionEngine.calculateCommission(taxableAmount, commissionRule);
    
    // Net chef earnings
    const netChefEarnings = taxableAmount - platformCommission - taxAmount;

    // 4. Update Order record
    await supabase.from('orders').update({
      platform_commission: platformCommission,
      tax_amount: taxAmount,
      net_chef_earnings: netChefEarnings
    }).eq('id', order.id);

    // 5. Financial Transactions
    // Get wallets
    const kitchen = await KitchenService.getKitchenById(order.kitchen_id);
    const chefWallet = await WalletService.getWallet(kitchen.chef_user_id, 'CHEF');
    const platformWallet = await WalletService.getWallet(null, 'PLATFORM'); // null user_id means Platform

    // The money is currently sitting in the Consumer's card / PG account. We simulate it entering the system.
    // A. Credit Chef Wallet (Net Earnings)
    await TransactionEngine.execute({
      from_wallet_id: null,
      to_wallet_id: chefWallet.id,
      amount: netChefEarnings,
      transaction_type: 'CREDIT',
      source: 'ORDER_EARNING',
      order_id: order.id,
      description: `Earnings for Order #${order.id}`
    });

    // B. Credit Platform Wallet (Commission + Tax + Delivery Fee collected by platform)
    await TransactionEngine.execute({
      from_wallet_id: null,
      to_wallet_id: platformWallet.id,
      amount: platformCommission + taxAmount + deliveryFee,
      transaction_type: 'CREDIT',
      source: 'ORDER_COMMISSION',
      order_id: order.id,
      description: `Commission & Fees for Order #${order.id}`
    });

    internalEventBus.emit(EVENTS.EARNINGS_GENERATED, { order_id: order.id, netChefEarnings });
  }
}

// Register Listeners
internalEventBus.on(EVENTS.ORDER_COMPLETED, async (order) => {
  try {
    await EarningsEngine.processOrderEarnings(order);
  } catch (err) {
    console.error(`Failed to process earnings for order ${order.id}:`, err);
  }
});
