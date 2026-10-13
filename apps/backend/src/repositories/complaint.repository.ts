import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { complaints } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Complaint, ComplaintStatus } from '../types/complaint';

// complaints never existed (confirmed absent from the live schema dump)
// despite being live-routed under /crm/complaints. The old fallback to a
// second table, support_tickets, also didn't exist — removed since it's
// dead code once this table actually works. Created via
// supabase/local/012_complaints_table.sql.
export class ComplaintRepository {
  static async createComplaint(payload: Omit<Complaint, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Complaint> {
    const rows = await db
      .insert(complaints)
      .values({ ...(toCamelCaseInput(payload) as any), status: 'OPEN' })
      .returning();
    return rowToSnakeCase<Complaint>(rows[0]);
  }

  static async updateStatus(id: string, status: ComplaintStatus, resolution_notes?: string): Promise<Complaint> {
    const rows = await db
      .update(complaints)
      .set({ status, resolutionNotes: resolution_notes, updatedAt: new Date().toISOString() })
      .where(eq(complaints.id, id))
      .returning();
    return rowToSnakeCase<Complaint>(rows[0]);
  }

  static async getComplaints(limit: number, offset: number): Promise<Complaint[]> {
    try {
      const rows = await db.select().from(complaints).orderBy(desc(complaints.createdAt)).limit(limit).offset(offset);
      return rowsToSnakeCase<Complaint>(rows);
    } catch (e) {
      return [];
    }
  }
}
