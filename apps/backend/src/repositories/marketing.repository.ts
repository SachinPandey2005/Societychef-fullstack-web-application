import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { marketingPreferences, marketingCampaigns, customerEngagement } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Campaign, CustomerEngagement, MarketingPreference } from '../types/marketing';

// marketing_preferences/marketing_campaigns/customer_engagement never
// existed (confirmed absent from the live schema dump) despite being
// live-routed. Distinct from campaign.repository.ts's `campaigns` table —
// two separately-specified campaign concepts in this codebase, both now
// real. Created via supabase/local/019_marketing_tables.sql.
export class MarketingRepository {
  // Preferences
  static async getPreferences(profile_id: string): Promise<MarketingPreference> {
    const rows = await db.select().from(marketingPreferences).where(eq(marketingPreferences.id, profile_id)).limit(1);
    if (!rows[0]) {
      // Default to opted-in for new records, or depending on business rules
      return this.updatePreferences(profile_id, {
        email_opt_in: true,
        sms_opt_in: true,
        push_opt_in: true,
        promotions_opt_in: true,
      } as any);
    }
    return rowToSnakeCase<MarketingPreference>(rows[0]);
  }

  static async updatePreferences(profile_id: string, payload: Partial<MarketingPreference>): Promise<MarketingPreference> {
    const values = { ...(toCamelCaseInput(payload) as any), updatedAt: new Date().toISOString() };
    const rows = await db
      .insert(marketingPreferences)
      .values({ id: profile_id, ...values })
      .onConflictDoUpdate({ target: marketingPreferences.id, set: values })
      .returning();
    return rowToSnakeCase<MarketingPreference>(rows[0]);
  }

  // Campaigns
  static async createCampaign(payload: Omit<Campaign, 'id' | 'status' | 'created_at'>): Promise<Campaign> {
    const rows = await db
      .insert(marketingCampaigns)
      .values({ ...(toCamelCaseInput(payload) as any), status: 'DRAFT' })
      .returning();
    return rowToSnakeCase<Campaign>(rows[0]);
  }

  static async updateCampaignStatus(id: string, status: string): Promise<Campaign> {
    const rows = await db.update(marketingCampaigns).set({ status }).where(eq(marketingCampaigns.id, id)).returning();
    return rowToSnakeCase<Campaign>(rows[0]);
  }

  static async getCampaigns(): Promise<Campaign[]> {
    const rows = await db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));
    return rowsToSnakeCase<Campaign>(rows);
  }

  // Engagement
  static async recordEngagement(payload: Omit<CustomerEngagement, 'id' | 'created_at'>): Promise<CustomerEngagement> {
    const rows = await db.insert(customerEngagement).values(toCamelCaseInput(payload) as any).returning();
    return rowToSnakeCase<CustomerEngagement>(rows[0]);
  }

  static async getCampaignAnalytics(campaign_id: string): Promise<any> {
    // For demo purposes, simply count the occurrences of each status
    const rows = await db
      .select({ status: customerEngagement.status })
      .from(customerEngagement)
      .where(eq(customerEngagement.campaignId, campaign_id));

    const stats = { SENT: 0, DELIVERED: 0, OPENED: 0, CONVERTED: 0 };
    rows.forEach((e) => {
      if (stats[e.status as keyof typeof stats] !== undefined) {
        stats[e.status as keyof typeof stats]++;
      }
    });

    return stats;
  }
}
