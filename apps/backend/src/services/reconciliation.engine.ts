import { supabase } from '../config/supabase';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';

export class ReconciliationEngine {
  /**
   * Audits the entire system by ensuring Wallet Balances strictly match the 
   * sum of all executed transactions in the immutable ledger.
   */
  static async auditLedger() {
    logger.info('Running Financial Reconciliation Engine...');
    let mismatches = 0;
    const discrepancies: any[] = [];

    // Fetch all active wallets
    const { data: wallets, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('status', 'ACTIVE');
      
    if (walletErr) throw walletErr;

    for (const wallet of wallets || []) {
      // Sum all CREDITS
      const { data: credits } = await supabase
        .from('financial_ledger')
        .select('amount')
        .eq('credit_wallet_id', wallet.id);
        
      const totalCredits = credits?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // Sum all DEBITS
      const { data: debits } = await supabase
        .from('financial_ledger')
        .select('amount')
        .eq('debit_wallet_id', wallet.id);
        
      const totalDebits = debits?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // The expected balance should strictly be: Credits - Debits
      const expectedBalance = totalCredits - totalDebits;

      // Calculate any HELD amounts (Pending Settlements) from wallet_transactions
      const { data: holds } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', wallet.id)
        .eq('transaction_type', 'HOLD')
        .eq('status', 'COMPLETED'); // Holds that haven't been released or debited
        
      const { data: holdsReleasedOrDebited } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .in('transaction_type', ['RELEASE', 'DEBIT'])
        .eq('wallet_id', wallet.id)
        .not('reference_id', 'is', null); // Matches the Hold reference ideally

      // We use a simplified hold logic check here for demonstration.
      // Realistically we'd match the exact state machine of held vs released IDs.
      
      if (Math.abs(wallet.balance - expectedBalance) > 0.01) {
        mismatches++;
        discrepancies.push({
          wallet_id: wallet.id,
          expected_balance: expectedBalance,
          actual_balance: wallet.balance,
          difference: expectedBalance - wallet.balance,
        });
      }
    }

    if (mismatches > 0) {
      logger.warn(`Reconciliation complete with ${mismatches} mismatches!`);
      internalEventBus.emit(EVENTS.SECURITY_ALERT, { type: 'RECONCILIATION_FAILED', discrepancies });
    } else {
      logger.info('Reconciliation complete. All ledgers are perfectly balanced.');
    }

    return { mismatches, discrepancies };
  }
}
