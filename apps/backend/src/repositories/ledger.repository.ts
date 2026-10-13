import { desc, eq, or } from 'drizzle-orm';
import { db } from '../db/client';
import { financialLedger } from '../db/schema';
import { rowsToSnakeCase } from '../db/caseMapper';
import { LedgerEntry } from '../types/wallet';

export class LedgerRepository {
  static async getLedgerEntries(wallet_id: string, limit = 50, offset = 0): Promise<LedgerEntry[]> {
    const rows = await db
      .select()
      .from(financialLedger)
      .where(or(eq(financialLedger.debitWalletId, wallet_id), eq(financialLedger.creditWalletId, wallet_id)))
      .orderBy(desc(financialLedger.createdAt))
      .limit(limit)
      .offset(offset);
    return rowsToSnakeCase<LedgerEntry>(rows);
  }

  static async getTransactionByReference(reference_id: string): Promise<LedgerEntry[]> {
    const rows = await db.select().from(financialLedger).where(eq(financialLedger.transactionReference, reference_id));
    return rowsToSnakeCase<LedgerEntry>(rows);
  }
}
