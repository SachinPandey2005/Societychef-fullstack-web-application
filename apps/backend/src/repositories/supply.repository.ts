import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { supplyItems, supplyOrders, supplyOrderItems } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';

export interface SupplyOrderItemInput {
  supply_item_id: string;
  quantity: number;
}

export class SupplyRepository {
  static async getItems(): Promise<any[]> {
    const rows = await db.select().from(supplyItems);
    return rowsToSnakeCase<any>(rows);
  }

  static async getItemById(id: string): Promise<any | null> {
    const rows = await db.select().from(supplyItems).where(eq(supplyItems.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async createOrder(kitchenId: string, totalAmount: number): Promise<any> {
    const rows = await db.insert(supplyOrders).values({ kitchenId, totalAmount, status: 'PLACED' }).returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async createOrderItems(items: { supply_order_id: string; supply_item_id: string; item_name_snapshot: string; price_snapshot: number; quantity: number }[]): Promise<void> {
    if (items.length === 0) return;
    await db.insert(supplyOrderItems).values(
      items.map((item) => ({
        supplyOrderId: item.supply_order_id,
        supplyItemId: item.supply_item_id,
        itemNameSnapshot: item.item_name_snapshot,
        priceSnapshot: item.price_snapshot,
        quantity: item.quantity,
      }))
    );
  }

  static async getOrdersForKitchen(kitchenId: string): Promise<any[]> {
    const orders = await db.select().from(supplyOrders).where(eq(supplyOrders.kitchenId, kitchenId)).orderBy(desc(supplyOrders.createdAt));
    const results = [];
    for (const order of orders) {
      const items = await db.select().from(supplyOrderItems).where(eq(supplyOrderItems.supplyOrderId, order.id));
      results.push({ ...rowToSnakeCase<any>(order), items: rowsToSnakeCase<any>(items) });
    }
    return results;
  }
}
