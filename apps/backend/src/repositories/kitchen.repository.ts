import { avg, count, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { kitchens, reviews, orders } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Kitchen, CreateKitchenInput, UpdateKitchenInput } from '../types/kitchen';

export interface KitchenStats {
  rating: number;
  review_count: number;
  orders_completed: number;
}

export class KitchenRepository {
  static async findAll(): Promise<Kitchen[]> {
    const rows = await db.select().from(kitchens);
    return rowsToSnakeCase<Kitchen>(rows);
  }

  static async findById(id: string): Promise<Kitchen | null> {
    const rows = await db.select().from(kitchens).where(eq(kitchens.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<Kitchen>(rows[0]) : null;
  }

  /**
   * Resolves a chef's own kitchen from their authenticated user id.
   *
   * A handful of chef-facing finance endpoints (earnings, settlements, payout
   * requests) assumed `req.user.kitchen_id` existed and would read `undefined`
   * off of it — nothing in the auth middleware ever populates that field, so
   * those queries silently matched zero rows for every chef. This is the
   * correct lookup: a kitchen's owner is `chef_user_id`, not a claim on the JWT.
   */
  static async findByChefUserId(chefUserId: string): Promise<Kitchen | null> {
    const rows = await db.select().from(kitchens).where(eq(kitchens.chefUserId, chefUserId)).limit(1);
    return rows[0] ? rowToSnakeCase<Kitchen>(rows[0]) : null;
  }

  static async create(payload: CreateKitchenInput): Promise<Kitchen> {
    const rows = await db.insert(kitchens).values(toCamelCaseInput(payload)).returning();
    return rowToSnakeCase<Kitchen>(rows[0]);
  }

  static async update(id: string, payload: UpdateKitchenInput): Promise<Kitchen | null> {
    const rows = await db.update(kitchens).set(toCamelCaseInput(payload)).where(eq(kitchens.id, id)).returning();
    return rows[0] ? rowToSnakeCase<Kitchen>(rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    await db.delete(kitchens).where(eq(kitchens.id, id));
    return true;
  }

  /**
   * Reads the chef's saved payout bank account off a kitchen row.
   *
   * The mobile app's settlements screen (apps/mobile/app/(chef)/settlements.tsx)
   * saves bank details as `{ holder, ifsc, account }` nested at
   * kitchen_info.kitchenDetails.bankDetails — that's the one path that's
   * actually written to. PayoutService.payChef previously read a different
   * shape (`kitchen_info.bank_details.{account_number,ifsc_code,upi_id}`) that
   * nothing ever wrote, so every real payout fell back to "Default Registered
   * Bank Account" instead of the chef's real details. This is the one place
   * that reads it now, so both payout paths agree.
   */
  static getBankDetails(kitchen: any): { holder: string; ifsc: string; account: string } | null {
    const info = kitchen?.kitchen_info || kitchen?.kitchenInfo;
    const bank = info?.kitchenDetails?.bankDetails || info?.bankDetails;
    if (!bank || !bank.account) return null;
    return { holder: bank.holder || '', ifsc: bank.ifsc || '', account: bank.account };
  }

  /**
   * Real per-kitchen rating/order-count, replacing the hardcoded
   * 4.9/4.7 (is_top_rated ? ... : ...) and `orders: 25` every kitchen object
   * carried in apps/mobile/services/supabase/index.ts#mapDbKitchen. One bulk
   * query each (not per-kitchen) since this backs the discover feed, which
   * renders many kitchens at once. reviews.kitchen_id is text, not uuid — no
   * real FK — so this is a plain GROUP BY, not a join.
   */
  static async getStatsMap(kitchenIds?: string[]): Promise<Record<string, KitchenStats>> {
    const ratingRows = await db
      .select({ kitchenId: reviews.kitchenId, avgRating: avg(reviews.rating), reviewCount: count(reviews.id) })
      .from(reviews)
      .groupBy(reviews.kitchenId);

    const orderRows = await db
      .select({ kitchenId: orders.kitchenId, deliveredCount: count(orders.id) })
      .from(orders)
      .where(eq(orders.status, 'DELIVERED'))
      .groupBy(orders.kitchenId);

    const map: Record<string, KitchenStats> = {};
    for (const row of ratingRows) {
      if (!row.kitchenId) continue;
      map[row.kitchenId] = {
        rating: Math.round(Number(row.avgRating || 0) * 10) / 10,
        review_count: Number(row.reviewCount || 0),
        orders_completed: 0,
      };
    }
    for (const row of orderRows) {
      if (!row.kitchenId) continue;
      if (!map[row.kitchenId]) map[row.kitchenId] = { rating: 0, review_count: 0, orders_completed: 0 };
      map[row.kitchenId].orders_completed = Number(row.deliveredCount || 0);
    }

    if (kitchenIds && kitchenIds.length > 0) {
      const filtered: Record<string, KitchenStats> = {};
      for (const id of kitchenIds) {
        filtered[id] = map[id] || { rating: 0, review_count: 0, orders_completed: 0 };
      }
      return filtered;
    }
    return map;
  }
}
