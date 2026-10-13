import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { accountingJournals, accountingLedgerLines, taxRecords } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { JournalEntry, JournalLine, TaxRecord } from '../types/accounting';

// accounting_journals/accounting_ledger_lines/tax_records never existed
// (confirmed absent from the live schema dump) despite being a live, routed
// feature (GET /finance/accounting/journals, admin-only) wired to fire on
// every completed order. Caught in a try/catch at the event-listener level
// (accounting.service.ts), so this failed silently rather than breaking
// order completion. Created via supabase/local/011_accounting_tables.sql.
export class AccountingRepository {
  static async postJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at'>, lines: Omit<JournalLine, 'id' | 'journal_id'>[]): Promise<void> {
    const journalRows = await db.insert(accountingJournals).values(toCamelCaseInput(entry) as any).returning();
    const journal = journalRows[0];

    await db.insert(accountingLedgerLines).values(
      lines.map((line) => ({
        journalId: journal.id,
        accountId: line.account_id,
        isCredit: line.is_credit,
        amount: line.amount,
      }))
    );
  }

  static async recordTax(tax: Omit<TaxRecord, 'id' | 'created_at'>): Promise<void> {
    await db.insert(taxRecords).values(toCamelCaseInput(tax) as any);
  }

  static async getJournalEntries(limit: number = 50): Promise<JournalEntry[]> {
    const journalRows = await db.select().from(accountingJournals).orderBy(desc(accountingJournals.createdAt)).limit(limit);
    const journals = rowsToSnakeCase<any>(journalRows);

    const journalIds = journals.map((j) => j.id);
    // Fetch lines per journal (small admin report, not a hot path)
    const allLines = journalIds.length
      ? await Promise.all(journalIds.map((id) => db.select().from(accountingLedgerLines).where(eq(accountingLedgerLines.journalId, id))))
      : [];
    const linesByJournal = new Map(journalIds.map((id, i) => [id, rowsToSnakeCase<any>(allLines[i])]));

    return journals.map((j) => ({ ...j, accounting_ledger_lines: linesByJournal.get(j.id) || [] })) as any[];
  }
}
