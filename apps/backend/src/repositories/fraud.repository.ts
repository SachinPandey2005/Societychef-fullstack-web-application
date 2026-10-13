import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { fraudRules, trustScores, fraudCases, fraudActivityLogs } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { FraudRule, TrustScore, FraudCase } from '../types/fraud';

// fraud_rules/trust_scores/fraud_cases/fraud_activity_logs never existed
// (confirmed absent from the live schema dump) despite being live-routed
// (fraud.routes.ts). Created via supabase/local/015_fraud_tables.sql.
export class FraudRepository {
  // Rules
  static async getActiveRules(): Promise<FraudRule[]> {
    const rows = await db
      .select()
      .from(fraudRules)
      .where(eq(fraudRules.isActive, true))
      .orderBy(desc(fraudRules.priority));
    return rowsToSnakeCase<FraudRule>(rows);
  }

  static async createRule(payload: Omit<FraudRule, 'id' | 'created_at' | 'updated_at'>): Promise<FraudRule> {
    const rows = await db.insert(fraudRules).values(toCamelCaseInput(payload) as any).returning();
    return rowToSnakeCase<FraudRule>(rows[0]);
  }

  // Trust Scores
  static async getTrustScore(profile_id: string): Promise<TrustScore> {
    const rows = await db.select().from(trustScores).where(eq(trustScores.id, profile_id)).limit(1);
    if (!rows[0]) {
      return { id: profile_id, score: 100, factors: {} } as TrustScore;
    }
    return rowToSnakeCase<TrustScore>(rows[0]);
  }

  // Cases
  static async createCase(payload: Omit<FraudCase, 'id' | 'created_at'>): Promise<FraudCase> {
    const rows = await db
      .insert(fraudCases)
      .values({ ...(toCamelCaseInput(payload) as any), status: 'OPEN' })
      .returning();
    return rowToSnakeCase<FraudCase>(rows[0]);
  }

  static async resolveCase(id: string, status: string, resolution_notes: string): Promise<FraudCase> {
    const rows = await db
      .update(fraudCases)
      .set({ status, resolutionNotes: resolution_notes })
      .where(eq(fraudCases.id, id))
      .returning();
    return rowToSnakeCase<FraudCase>(rows[0]);
  }

  // Immutable Audit
  static async logActivity(actor_id: string, action: string, details: Record<string, any>): Promise<void> {
    await db.insert(fraudActivityLogs).values({ actorId: actor_id, action, details });
  }
}
