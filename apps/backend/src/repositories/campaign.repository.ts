import { and, desc, eq, lte } from 'drizzle-orm';
import { db } from '../db/client';
import { campaigns } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Campaign } from '../types/campaign';

// campaigns never existed (confirmed absent from the live schema dump)
// despite being live-routed under /campaigns. Created via
// supabase/local/010_campaigns_table.sql.
export class CampaignRepository {
  static async createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'metrics_sent' | 'metrics_opened' | 'metrics_converted'>): Promise<Campaign> {
    const rows = await db
      .insert(campaigns)
      .values({
        ...(toCamelCaseInput(campaign) as any),
        metricsSent: 0,
        metricsOpened: 0,
        metricsConverted: 0,
      })
      .returning();
    return rowToSnakeCase<Campaign>(rows[0]);
  }

  static async getActiveCampaigns(): Promise<Campaign[]> {
    const rows = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.isActive, true), lte(campaigns.startDate, new Date().toISOString())))
      .orderBy(desc(campaigns.createdAt));
    return rowsToSnakeCase<Campaign>(rows);
  }

  static async updateStatus(id: string, is_active: boolean): Promise<Campaign> {
    const rows = await db.update(campaigns).set({ isActive: is_active }).where(eq(campaigns.id, id)).returning();
    return rowToSnakeCase<Campaign>(rows[0]);
  }
}
