import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { dishAddons } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { DishAddon, CreateAddonInput, UpdateAddonInput } from '../types/addon';

export class AddonRepository {
  static async findByDishId(dishId: string): Promise<DishAddon[]> {
    const rows = await db.select().from(dishAddons).where(eq(dishAddons.dishId, dishId));
    return rowsToSnakeCase<DishAddon>(rows);
  }

  static async findByIds(ids: string[]): Promise<DishAddon[]> {
    if (ids.length === 0) return [];
    const rows = await db.select().from(dishAddons).where(inArray(dishAddons.id, ids));
    return rowsToSnakeCase<DishAddon>(rows);
  }

  static async findById(id: string): Promise<DishAddon | null> {
    const rows = await db.select().from(dishAddons).where(eq(dishAddons.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<DishAddon>(rows[0]) : null;
  }

  static async create(payload: CreateAddonInput): Promise<DishAddon> {
    const rows = await db.insert(dishAddons).values(toCamelCaseInput(payload)).returning();
    return rowToSnakeCase<DishAddon>(rows[0]);
  }

  static async update(id: string, payload: UpdateAddonInput): Promise<DishAddon | null> {
    const rows = await db.update(dishAddons).set(toCamelCaseInput(payload)).where(eq(dishAddons.id, id)).returning();
    return rows[0] ? rowToSnakeCase<DishAddon>(rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    await db.delete(dishAddons).where(eq(dishAddons.id, id));
    return true;
  }
}
