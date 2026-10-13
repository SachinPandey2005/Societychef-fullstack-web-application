import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { recommendationPreferences, recommendationFeedback, dishes, kitchens } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { UserPreference, RecommendationFeedback } from '../types/recommendation';

// recommendation_preferences/recommendation_feedback never existed
// (confirmed absent from the live schema dump) despite being live-routed.
// Created via supabase/local/014_recommendation_tables.sql.
export class RecommendationRepository {
  static async updatePreferences(profile_id: string, payload: Partial<UserPreference>): Promise<UserPreference> {
    const values = { ...(toCamelCaseInput(payload) as any), updatedAt: new Date().toISOString() };
    const rows = await db
      .insert(recommendationPreferences)
      .values({ id: profile_id, ...values })
      .onConflictDoUpdate({ target: recommendationPreferences.id, set: values })
      .returning();
    return rowToSnakeCase<UserPreference>(rows[0]);
  }

  static async getPreferences(profile_id: string): Promise<UserPreference | null> {
    const rows = await db.select().from(recommendationPreferences).where(eq(recommendationPreferences.id, profile_id)).limit(1);
    return rows[0] ? rowToSnakeCase<UserPreference>(rows[0]) : null;
  }

  static async submitFeedback(feedback: Omit<RecommendationFeedback, 'id' | 'created_at'>): Promise<void> {
    await db.insert(recommendationFeedback).values(toCamelCaseInput(feedback) as any);
  }

  static async getDislikedItemIds(profile_id: string): Promise<string[]> {
    const rows = await db
      .select({ itemId: recommendationFeedback.itemId, action: recommendationFeedback.action })
      .from(recommendationFeedback)
      .where(eq(recommendationFeedback.profileId, profile_id));
    return rows.filter((r) => r.action === 'DISLIKE' || r.action === 'NOT_INTERESTED').map((r) => r.itemId);
  }

  static async getTrendingDishes(society_id: string, limit: number = 5): Promise<any[]> {
    // In a real scenario, this would use a materialized view or complex aggregation.
    // For now, we simulate by fetching dishes from kitchens in this society.
    const rows = await db
      .select({ dish: dishes })
      .from(dishes)
      .innerJoin(kitchens, eq(dishes.kitchenId, kitchens.id))
      .where(eq(kitchens.societyId, society_id))
      .limit(limit);
    return rowsToSnakeCase<any>(rows.map((r) => r.dish));
  }

  static async getTrendingKitchens(society_id: string, limit: number = 5): Promise<any[]> {
    const rows = await db.select().from(kitchens).where(eq(kitchens.societyId, society_id)).limit(limit);
    return rowsToSnakeCase<any>(rows);
  }
}
