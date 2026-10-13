import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { dishes, kitchens, profiles, orders } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Dish, CreateDishInput, UpdateDishInput } from '../types/dish';

export class DishRepository {
  /**
   * Previously silently returned 8 hardcoded fake dishes (fake ratings,
   * fake Unsplash photos, fake prices) on ANY DB error or simply zero real
   * rows — a real empty catalog looked identical to a broken connection,
   * and either way a customer saw dishes that didn't exist and could never
   * actually be ordered. Now in the direct path of the consumer discover
   * feed (Phase 3.5), so a real empty result is returned honestly and a
   * real DB error is allowed to propagate as a real error instead of being
   * swallowed and papered over.
   */
  static async findAll(kitchenId?: string): Promise<Dish[]> {
    const rows = kitchenId
      ? await db.select().from(dishes).where(eq(dishes.kitchenId, kitchenId))
      : await db.select().from(dishes);
    return rowsToSnakeCase<Dish>(rows);
  }

  static async findById(id: string): Promise<Dish | null> {
    const rows = await db.select().from(dishes).where(eq(dishes.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<Dish>(rows[0]) : null;
  }

  static async create(payload: CreateDishInput): Promise<Dish> {
    const rows = await db.insert(dishes).values(toCamelCaseInput(payload)).returning();
    return rowToSnakeCase<Dish>(rows[0]);
  }

  static async update(id: string, payload: UpdateDishInput): Promise<Dish | null> {
    const rows = await db.update(dishes).set(toCamelCaseInput(payload)).where(eq(dishes.id, id)).returning();
    return rows[0] ? rowToSnakeCase<Dish>(rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    await db.delete(dishes).where(eq(dishes.id, id));
    return true;
  }

  /**
   * The consumer discover feed's data source — available dishes from live
   * kitchens, each with its kitchen (and the kitchen's chef profile name)
   * nested exactly the way apps/mobile/services/supabase/index.ts#getListings
   * used to shape its own direct Supabase join, so the existing client-side
   * filter/sort/map logic there needs no changes, only the fetch itself.
   */
  static async getAvailableWithKitchens(): Promise<any[]> {
    const rows = await db
      .select({ dish: dishes, kitchen: kitchens, chefName: profiles.name, chefDisplayName: profiles.displayName })
      .from(dishes)
      .innerJoin(kitchens, eq(dishes.kitchenId, kitchens.id))
      .leftJoin(profiles, eq(kitchens.chefUserId, profiles.id))
      .where(eq(dishes.isAvailable, true));

    // Real per-kitchen order counts — the mobile discover feed previously
    // had no order-count field at all and fell back to a hardcoded 120 for
    // every single kitchen (ListingCard.tsx's `kitchen.orders || 120`).
    const counts = await db
      .select({ kitchenId: orders.kitchenId, count: sql<number>`count(*)` })
      .from(orders)
      .groupBy(orders.kitchenId);
    const countByKitchen = new Map(counts.map((c) => [c.kitchenId, Number(c.count)]));

    return rows.map((r) => ({
      ...rowToSnakeCase<any>(r.dish),
      kitchens: {
        ...rowToSnakeCase<any>(r.kitchen),
        profiles: { name: r.chefName, display_name: r.chefDisplayName },
        order_count: countByKitchen.get(r.kitchen.id) || 0,
      },
    }));
  }
}
