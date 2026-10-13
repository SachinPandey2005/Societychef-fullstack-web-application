import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { wallets, walletTransactions, financialLedger, financialAuditLogs } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import { Wallet, WalletTransaction, WalletOwnerType } from '../types/wallet';

export class WalletRepository {
  static async getWallet(user_id: string | null, wallet_type: WalletOwnerType): Promise<Wallet> {
    const rows = await db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.walletType, wallet_type),
          user_id ? eq(wallets.userId, user_id) : isNull(wallets.userId)
        )
      )
      .limit(1);

    if (rows[0]) return rowToSnakeCase<Wallet>(rows[0]);
    return this.createWallet(user_id, wallet_type);
  }

  static async createWallet(user_id: string | null, wallet_type: WalletOwnerType): Promise<Wallet> {
    const rows = await db
      .insert(wallets)
      .values({ userId: user_id, walletType: wallet_type, balance: 0, currency: 'INR', status: 'ACTIVE' })
      .returning();
    return rowToSnakeCase<Wallet>(rows[0]);
  }

  /**
   * Reimplements supabase/migrations/006_financial_core.sql's
   * execute_financial_transaction Postgres function directly in TypeScript,
   * rather than porting the stored procedure itself — that function also
   * depends on financial_ledger/financial_audit_logs, which were confirmed
   * absent from the live database (006 was apparently never applied there),
   * so this was never actually callable via supabase.rpc() against the real
   * project either. Same lock ordering, balance/currency/status checks, and
   * CREDIT/DEBIT/HOLD/RELEASE semantics as the original, inside one Drizzle
   * transaction with row-level locking (`.for('update')`) so concurrent
   * transfers touching the same wallet still serialize correctly.
   */
  static async executeFinancialTransaction(params: {
    from_wallet_id: string | null;
    to_wallet_id: string | null;
    amount: number;
    currency: string;
    transaction_type: string;
    source: string;
    reference_id: string | null;
    order_id: string | null;
    payment_id: string | null;
    description: string;
  }): Promise<{ success: true; transaction_id: string; ledger_id: string }> {
    const { from_wallet_id, to_wallet_id, amount, currency, transaction_type, source, reference_id, order_id, description } = params;

    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    if (!from_wallet_id && !to_wallet_id) {
      throw new Error('At least one wallet must be provided');
    }

    return db.transaction(async (tx) => {
      const transactionId = crypto.randomUUID();

      // Consistent lock ordering (lower id first) to avoid deadlocks when two
      // transfers touch the same pair of wallets in opposite directions —
      // mirrors the original function's `IF p_from_wallet_id < p_to_wallet_id`.
      const lockOrder =
        from_wallet_id && to_wallet_id
          ? from_wallet_id < to_wallet_id
            ? [from_wallet_id, to_wallet_id]
            : [to_wallet_id, from_wallet_id]
          : [from_wallet_id || to_wallet_id];

      const locked = new Map<string, any>();
      for (const id of lockOrder) {
        const rows = await tx.select().from(wallets).where(eq(wallets.id, id as string)).for('update');
        if (!rows[0]) throw new Error(`Wallet ${id} not found`);
        locked.set(id as string, rowToSnakeCase<Wallet>(rows[0]));
      }

      if (from_wallet_id) {
        const fromWallet = locked.get(from_wallet_id)!;
        if (fromWallet.status !== 'ACTIVE') throw new Error('Source wallet is not active');
        if (fromWallet.currency !== currency) throw new Error('Currency mismatch on source wallet');
        if (fromWallet.balance < amount) throw new Error('Insufficient funds in source wallet');

        const newBalance = fromWallet.balance - amount;
        await tx.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, from_wallet_id));
        await tx.insert(walletTransactions).values({
          transactionId,
          walletId: from_wallet_id,
          amount,
          type: transaction_type === 'HOLD' ? 'HOLD' : 'DEBIT',
          source,
          referenceId: reference_id,
          orderId: order_id,
          paymentId: params.payment_id,
        });
        await tx.insert(financialAuditLogs).values({
          walletId: from_wallet_id,
          action: transaction_type === 'HOLD' ? 'HOLD' : 'DEBIT',
          oldBalance: fromWallet.balance,
          newBalance,
        });
      }

      if (to_wallet_id) {
        const toWallet = locked.get(to_wallet_id)!;
        if (toWallet.status !== 'ACTIVE') throw new Error('Destination wallet is not active');
        if (toWallet.currency !== currency) throw new Error('Currency mismatch on destination wallet');

        const newBalance = toWallet.balance + amount;
        await tx.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, to_wallet_id));
        await tx.insert(walletTransactions).values({
          transactionId,
          walletId: to_wallet_id,
          amount,
          type: transaction_type === 'RELEASE' ? 'RELEASE' : 'CREDIT',
          source,
          referenceId: reference_id,
          orderId: order_id,
          paymentId: params.payment_id,
        });
        await tx.insert(financialAuditLogs).values({
          walletId: to_wallet_id,
          action: transaction_type === 'RELEASE' ? 'RELEASE' : 'CREDIT',
          oldBalance: toWallet.balance,
          newBalance,
        });
      }

      const ledgerRows = await tx
        .insert(financialLedger)
        .values({
          debitWalletId: from_wallet_id,
          creditWalletId: to_wallet_id,
          amount,
          currency,
          transactionReference: reference_id,
          description,
        })
        .returning({ id: financialLedger.id });

      return { success: true, transaction_id: transactionId, ledger_id: ledgerRows[0].id };
    });
  }

  static async getTransactions(wallet_id: string, limit = 50, offset = 0): Promise<WalletTransaction[]> {
    const rows = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet_id))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit)
      .offset(offset);
    return rowsToSnakeCase<WalletTransaction>(rows);
  }
}
