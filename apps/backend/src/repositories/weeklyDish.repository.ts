import { and, desc, eq, gte, ilike, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { weeklyDishes, kitchens, orders } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';

export class WeeklyDishRepository {
  static async findById(id: string) {
    const rows = await db.select().from(weeklyDishes).where(eq(weeklyDishes.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  /** A kitchen's own weekly-dish planner for a given week — all statuses. */
  static async findByKitchenAndWeek(kitchenId: string, weekStartDate: string) {
    const rows = await db
      .select()
      .from(weeklyDishes)
      .where(and(eq(weeklyDishes.kitchenId, kitchenId), eq(weeklyDishes.weekStartDate, weekStartDate)))
      .orderBy(desc(weeklyDishes.createdAt));
    return rowsToSnakeCase<any>(rows);
  }

  /** Resolves the existing row saveWeeklyDish would otherwise upsert onto. */
  static async findByNaturalKey(kitchenId: string, day: string, dishName: string, weekStartDate: string) {
    const rows = await db
      .select()
      .from(weeklyDishes)
      .where(and(
        eq(weeklyDishes.kitchenId, kitchenId),
        eq(weeklyDishes.day, day),
        ilike(weeklyDishes.dishName, dishName),
        eq(weeklyDishes.weekStartDate, weekStartDate),
      ))
      .limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  /**
   * Every active weekly dish for a week, joined with its kitchen's
   * name/chef_name/address — backs the consumer-facing weekly feed
   * (discover.tsx/weekly.tsx/dish/[id].tsx), replacing a direct Supabase
   * query that stopped seeing real data once this table moved to Drizzle.
   */
  static async findActiveForWeek(weekStartDate: string) {
    const rows = await db
      .select({
        weeklyDish: weeklyDishes,
        kitchen: {
          id: kitchens.id,
          name: kitchens.name,
          chefName: kitchens.chefName,
          address: kitchens.address,
        },
      })
      .from(weeklyDishes)
      .innerJoin(kitchens, eq(weeklyDishes.kitchenId, kitchens.id))
      .where(and(eq(weeklyDishes.status, 'active'), eq(weeklyDishes.weekStartDate, weekStartDate)));

    // Same real order-count fix as DishRepository.getAvailableWithKitchens —
    // this feed's kitchen objects had no order-count field at all before.
    const counts = await db
      .select({ kitchenId: orders.kitchenId, count: sql<number>`count(*)` })
      .from(orders)
      .groupBy(orders.kitchenId);
    const countByKitchen = new Map(counts.map((c) => [c.kitchenId, Number(c.count)]));

    return rows.map((r) => ({
      ...rowToSnakeCase<any>(r.weeklyDish),
      kitchens: { ...rowToSnakeCase<any>(r.kitchen), order_count: countByKitchen.get(r.kitchen.id) || 0 },
    }));
  }

  static async create(payload: Record<string, any>) {
    const rows = await db.insert(weeklyDishes).values(toCamelCaseInput(payload) as any).returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async update(id: string, payload: Record<string, any>) {
    const rows = await db.update(weeklyDishes).set(toCamelCaseInput(payload) as any).where(eq(weeklyDishes.id, id)).returning();
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    await db.delete(weeklyDishes).where(eq(weeklyDishes.id, id));
    return true;
  }

  /**
   * Atomically decrements remaining_quantity, only succeeding if enough
   * servings remain — the conditional WHERE is what makes this safe under
   * concurrent bookings, unlike computing "remaining - quantity" client-side
   * and writing the absolute result (two concurrent bookings would each
   * overwrite the other's decrement, allowing oversell).
   */
  static async decrementRemaining(id: string, quantity: number): Promise<boolean> {
    const rows = await db
      .update(weeklyDishes)
      .set({
        remainingQuantity: sql`${weeklyDishes.remainingQuantity} - ${quantity}`,
        status: sql`CASE WHEN ${weeklyDishes.remainingQuantity} - ${quantity} <= 0 THEN 'sold_out' ELSE ${weeklyDishes.status} END`,
      })
      .where(and(eq(weeklyDishes.id, id), gte(weeklyDishes.remainingQuantity, quantity)))
      .returning({ id: weeklyDishes.id });
    return rows.length > 0;
  }

  /**
   * Reverses decrementRemaining on order cancellation. Only flips status
   * back from 'sold_out' — a chef-paused/hidden dish should stay that way
   * even after a cancellation frees up stock.
   */
  static async restoreRemaining(id: string, quantity: number): Promise<void> {
    await db
      .update(weeklyDishes)
      .set({
        remainingQuantity: sql`${weeklyDishes.remainingQuantity} + ${quantity}`,
        status: sql`CASE WHEN ${weeklyDishes.status} = 'sold_out' THEN 'active' ELSE ${weeklyDishes.status} END`,
      })
      .where(eq(weeklyDishes.id, id));
  }
}
