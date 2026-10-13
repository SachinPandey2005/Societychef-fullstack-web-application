import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { aiTicketAnalysis, aiUsageLogs, aiMessages } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { TicketSuggestion, AIChatMessage, AIUsageLog } from '../types/ai';

// ai_ticket_analysis, ai_usage_logs and ai_messages never existed (confirmed
// absent from the live schema dump) despite being live, routed functionality
// (ai.controller.ts/ai.service.ts under /ai). logUsage in particular is
// called unconditionally inside ai_provider.service.ts's generateText, which
// retries on failure then re-throws — meaning the AI chat endpoint failed on
// every single call. Created via supabase/local/008_ai_feature_tables.sql.
export class AIRepository {
  static async saveTicketSuggestion(payload: Omit<TicketSuggestion, 'id' | 'created_at' | 'is_applied'>): Promise<TicketSuggestion> {
    const rows = await db
      .insert(aiTicketAnalysis)
      .values({ ...(toCamelCaseInput(payload) as any), isApplied: false })
      .returning();
    return rowToSnakeCase<TicketSuggestion>(rows[0]);
  }

  static async getTicketSuggestions(ticket_id: string): Promise<TicketSuggestion[]> {
    const rows = await db
      .select()
      .from(aiTicketAnalysis)
      .where(eq(aiTicketAnalysis.ticketId, ticket_id))
      .orderBy(desc(aiTicketAnalysis.createdAt));
    return rowsToSnakeCase<TicketSuggestion>(rows);
  }

  static async logUsage(payload: Omit<AIUsageLog, 'id' | 'created_at'>): Promise<void> {
    await db.insert(aiUsageLogs).values(toCamelCaseInput(payload) as any);
  }

  static async saveChatMessage(payload: Omit<AIChatMessage, 'id' | 'created_at'>): Promise<AIChatMessage> {
    const rows = await db.insert(aiMessages).values(toCamelCaseInput(payload) as any).returning();
    return rowToSnakeCase<AIChatMessage>(rows[0]);
  }
}
