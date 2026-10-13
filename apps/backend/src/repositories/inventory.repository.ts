import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { ingredients, kitchenInventory, recipeIngredients, inventoryTransactions, inventoryWastage } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Ingredient, InventoryRecord, RecipeIngredient, WastageRecord } from '../types/inventory';

// ingredients/kitchen_inventory/recipe_ingredients/inventory_transactions/
// inventory_wastage never existed (confirmed absent from the live schema
// dump) despite being live-routed (inventory.routes.ts). Created via
// supabase/local/020_inventory_tables.sql.
export class InventoryRepository {
  static async createIngredient(payload: Omit<Ingredient, 'id' | 'created_at'>, min_stock_level: number): Promise<Ingredient> {
    const ingredientRows = await db.insert(ingredients).values(toCamelCaseInput(payload) as any).returning();
    const ingredient = rowToSnakeCase<Ingredient>(ingredientRows[0]);

    await db.insert(kitchenInventory).values({
      ingredientId: ingredient.id,
      kitchenId: payload.kitchen_id,
      quantity: 0,
      reservedQuantity: 0,
      minStockLevel: min_stock_level,
    });

    return ingredient;
  }

  static async getInventory(kitchen_id: string): Promise<InventoryRecord[]> {
    const rows = await db
      .select({ inventory: kitchenInventory, ingredient: ingredients })
      .from(kitchenInventory)
      .innerJoin(ingredients, eq(kitchenInventory.ingredientId, ingredients.id))
      .where(eq(kitchenInventory.kitchenId, kitchen_id));

    return rows.map((r) => ({
      ...rowToSnakeCase<any>(r.inventory),
      ingredients: rowToSnakeCase<any>(r.ingredient),
    })) as any[];
  }

  static async getInventoryRecord(ingredient_id: string): Promise<InventoryRecord> {
    const rows = await db.select().from(kitchenInventory).where(eq(kitchenInventory.ingredientId, ingredient_id)).limit(1);
    if (!rows[0]) throw new Error(`Inventory record for ingredient ${ingredient_id} not found`);
    return rowToSnakeCase<InventoryRecord>(rows[0]);
  }

  static async addRecipeIngredient(payload: Omit<RecipeIngredient, 'id'>): Promise<RecipeIngredient> {
    const rows = await db.insert(recipeIngredients).values(toCamelCaseInput(payload) as any).returning();
    return rowToSnakeCase<RecipeIngredient>(rows[0]);
  }

  static async getRecipeForDish(dish_id: string): Promise<RecipeIngredient[]> {
    const rows = await db.select().from(recipeIngredients).where(eq(recipeIngredients.dishId, dish_id));
    return rowsToSnakeCase<RecipeIngredient>(rows);
  }

  static async adjustStock(ingredient_id: string, amount_change: number, reason: string = 'ADJUST'): Promise<InventoryRecord> {
    const current = await this.getInventoryRecord(ingredient_id);
    const newQuantity = current.quantity + amount_change;

    const rows = await db
      .update(kitchenInventory)
      .set({ quantity: newQuantity, updatedAt: new Date().toISOString() })
      .where(eq(kitchenInventory.id, current.id))
      .returning();

    await db.insert(inventoryTransactions).values({
      inventoryId: current.id,
      type: amount_change > 0 ? 'ADD' : 'DEDUCT',
      amount: Math.abs(amount_change),
      reason,
    });

    return rowToSnakeCase<InventoryRecord>(rows[0]);
  }

  static async logWastage(payload: Omit<WastageRecord, 'id' | 'created_at'>): Promise<void> {
    await db.insert(inventoryWastage).values(toCamelCaseInput(payload) as any);
  }
}
