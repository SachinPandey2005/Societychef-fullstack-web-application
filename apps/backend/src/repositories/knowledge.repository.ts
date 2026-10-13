import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../db/client';
import { knowledgeBaseArticles } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { KnowledgeArticle } from '../types/ai';

export class KnowledgeRepository {
  static async createArticle(payload: Omit<KnowledgeArticle, 'id' | 'status' | 'created_at'>): Promise<KnowledgeArticle> {
    const rows = await db
      .insert(knowledgeBaseArticles)
      .values({ ...(toCamelCaseInput(payload) as any), status: 'PUBLISHED' })
      .returning();
    return rowToSnakeCase<KnowledgeArticle>(rows[0]);
  }

  static async searchArticles(query: string): Promise<KnowledgeArticle[]> {
    // For now, doing a basic ilike keyword search.
    // In production, this would be a pgvector similarity search on `faq_embeddings`.
    const rows = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(
        and(
          eq(knowledgeBaseArticles.status, 'PUBLISHED'),
          or(
            ilike(knowledgeBaseArticles.title, `%${query}%`),
            ilike(knowledgeBaseArticles.content, `%${query}%`),
            ilike(knowledgeBaseArticles.category, `%${query}%`)
          )
        )
      )
      .limit(5);
    return rowsToSnakeCase<KnowledgeArticle>(rows);
  }

  static async getArticles(): Promise<KnowledgeArticle[]> {
    const rows = await db
      .select()
      .from(knowledgeBaseArticles)
      .where(eq(knowledgeBaseArticles.status, 'PUBLISHED'))
      .orderBy(desc(knowledgeBaseArticles.createdAt));
    return rowsToSnakeCase<KnowledgeArticle>(rows);
  }
}
