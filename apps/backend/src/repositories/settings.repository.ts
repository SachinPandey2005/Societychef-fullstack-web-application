import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { platformSettings } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import { PlatformSetting } from '../types/settings';

// platform_settings never existed (confirmed absent from the live schema
// dump), despite being live-routed in several places. getAllSettings had a
// silent fallback to 5 hardcoded fake settings whenever the real query
// failed or returned empty — meaning admins could never have actually
// persisted a change (updateSetting had no such fallback, so it always
// threw) while this screen always showed the same fake defaults regardless.
// Created and seeded with those same five defaults via
// supabase/local/018_platform_settings_table.sql, so the fallback below is
// now unreachable in practice but kept for parity with the original
// fail-safe behavior.
export class SettingsRepository {
  static async getAllSettings(): Promise<PlatformSetting[]> {
    try {
      const rows = await db.select().from(platformSettings);
      if (rows.length > 0) {
        return rowsToSnakeCase<PlatformSetting>(rows);
      }
    } catch (e: any) {
      console.warn('[SettingsRepository] DB query warning:', e.message);
    }

    return [
      {
        key: 'PLATFORM_COMMISSION_TIERS',
        value: {
          standard_percentage: 10,
          premium_percentage: 8,
          party_catering_percentage: 12,
        },
        description: 'Tiered platform commission percentages applied to chef payouts',
        category: 'FINANCE',
        updated_at: new Date().toISOString(),
        updated_by: 'system',
      },
      {
        key: 'PAYMENT_GATEWAY_CONFIG',
        value: {
          provider: 'RAZORPAY',
          auto_capture: true,
          settlement_cycle: 'WEEKLY',
          currency: 'INR',
        },
        description: 'Payment gateway integration parameters and payout release cycles',
        category: 'GATEWAY',
        updated_at: new Date().toISOString(),
        updated_by: 'system',
      },
      {
        key: 'DELIVERY_FLEET_RADIUS_KM',
        value: 7.5,
        description: 'Maximum delivery partner search radius in kilometers for society clusters',
        category: 'OPERATIONS',
        updated_at: new Date().toISOString(),
        updated_by: 'system',
      },
      {
        key: 'SURGE_PRICING_MULTIPLIER',
        value: 1.2,
        description: 'Peak period delivery fee multiplier for inclement weather or high demand',
        category: 'OPERATIONS',
        updated_at: new Date().toISOString(),
        updated_by: 'system',
      },
      {
        key: 'CHEF_PAYOUT_MINIMUM_THRESHOLD',
        value: 500,
        description: 'Minimum balance in INR required before automated batch payout execution',
        category: 'FINANCE',
        updated_at: new Date().toISOString(),
        updated_by: 'system',
      },
    ] as unknown as PlatformSetting[];
  }

  static async getSetting(key: string): Promise<PlatformSetting | null> {
    const rows = await db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
    return rows[0] ? rowToSnakeCase<PlatformSetting>(rows[0]) : null;
  }

  static async updateSetting(key: string, value: any, updated_by: string): Promise<PlatformSetting> {
    const rows = await db
      .update(platformSettings)
      .set({ value, updatedBy: updated_by, updatedAt: new Date().toISOString() })
      .where(eq(platformSettings.key, key))
      .returning();
    return rowToSnakeCase<PlatformSetting>(rows[0]);
  }
}
