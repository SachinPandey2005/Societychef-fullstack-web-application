import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { commissionRules } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import { CommissionRule, CreateCommissionRuleInput, UpdateCommissionRuleInput } from '../types/commission';

// commission_rules never existed (confirmed absent from the live schema
// dump) despite being live-routed (commission.routes.ts). rule_name/
// rule_type are synthesized in application code, not real columns —
// preserved exactly as before. Created via
// supabase/local/017_commission_rules_table.sql.
export class CommissionRepository {
  static async getAllRules(): Promise<CommissionRule[]> {
    const rows = rowsToSnakeCase<any>(await db.select().from(commissionRules).orderBy(desc(commissionRules.createdAt)));
    return rows.map((r) => ({
      ...r,
      rule_name: r.rule_name || (r.kitchen_id ? 'Chef-Specific Rule' : r.society_id ? 'Society Rule' : 'Default Platform Rule'),
      rule_type: (r.rule_type || (r.kitchen_id ? 'CHEF' : r.society_id ? 'SOCIETY' : 'DEFAULT')) as any,
    }));
  }

  static async getRuleById(id: string): Promise<CommissionRule | null> {
    const rows = await db.select().from(commissionRules).where(eq(commissionRules.id, id)).limit(1);
    if (!rows[0]) return null;
    const data = rowToSnakeCase<any>(rows[0]);
    return {
      ...data,
      rule_name: data.rule_name || 'Commission Rule',
      rule_type: (data.rule_type || (data.kitchen_id ? 'CHEF' : 'DEFAULT')) as any,
    };
  }

  static async createRule(payload: CreateCommissionRuleInput): Promise<CommissionRule> {
    const rows = await db
      .insert(commissionRules)
      .values({
        kitchenId: payload.kitchen_id || null,
        category: payload.category || null,
        percentage: payload.percentage,
        fixedFee: payload.fixed_fee || 0,
        active: payload.active !== false,
      })
      .returning();
    const data = rowToSnakeCase<any>(rows[0]);
    return {
      ...data,
      rule_name: payload.rule_name || 'Commission Rule',
      rule_type: payload.rule_type || 'DEFAULT',
    };
  }

  static async updateRule(id: string, payload: UpdateCommissionRuleInput): Promise<CommissionRule> {
    const updateData: any = {};
    if (payload.percentage !== undefined) updateData.percentage = payload.percentage;
    if (payload.fixed_fee !== undefined) updateData.fixedFee = payload.fixed_fee;
    if (payload.active !== undefined) updateData.active = payload.active;
    if (payload.kitchen_id !== undefined) updateData.kitchenId = payload.kitchen_id;
    if (payload.category !== undefined) updateData.category = payload.category;

    const rows = await db.update(commissionRules).set(updateData).where(eq(commissionRules.id, id)).returning();
    const data = rowToSnakeCase<any>(rows[0]);
    return {
      ...data,
      rule_name: payload.rule_name || 'Commission Rule',
      rule_type: payload.rule_type || 'DEFAULT',
    };
  }

  static async deleteRule(id: string): Promise<void> {
    await db.delete(commissionRules).where(eq(commissionRules.id, id));
  }
}
