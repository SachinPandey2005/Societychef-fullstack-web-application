import { AccountingRepository } from '../repositories/accounting.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';

export class AccountingService {
  static init() {
    internalEventBus.on(EVENTS.ORDER_COMPLETED, async (order) => {
      logger.info(`Posting double-entry journal for completed order ${order.id}`);
      try {
        await this.postRevenueJournal(order);
      } catch (err) {
        logger.error(`Failed to post journal for order ${order.id}`, err);
      }
    });

    internalEventBus.on(EVENTS.WALLET_CREDITED, async (wallet) => {
      // Stub for wallet liability tracking
    });
  }

  static async postRevenueJournal(order: any) {
    // Basic double-entry:
    // Debit Accounts Receivable (or Wallet Liability if paid by Wallet)
    // Credit Revenue
    // Credit Tax Payable (if applicable)

    const revenueAmount = order.total_amount;
    const taxAmount = revenueAmount * 0.05; // Dummy 5% tax

    // We assume predefined account IDs for simplicity
    const AR_ACCOUNT_ID = 'acct-ar';
    const REVENUE_ACCOUNT_ID = 'acct-rev';
    const TAX_ACCOUNT_ID = 'acct-tax';

    await AccountingRepository.postJournalEntry({
      transaction_date: new Date().toISOString(),
      description: `Revenue for Order ${order.id}`,
      reference_type: 'ORDER',
      reference_id: order.id,
      total_amount: revenueAmount
    }, [
      { account_id: AR_ACCOUNT_ID, is_credit: false, amount: revenueAmount }, // Debit
      { account_id: REVENUE_ACCOUNT_ID, is_credit: true, amount: revenueAmount - taxAmount }, // Credit
      { account_id: TAX_ACCOUNT_ID, is_credit: true, amount: taxAmount } // Credit
    ]);

    await AccountingRepository.recordTax({
      order_id: order.id,
      tax_type: 'GST',
      tax_rate: 5,
      tax_amount: taxAmount
    });
  }

  static async getJournals() {
    return AccountingRepository.getJournalEntries();
  }
}

AccountingService.init();
