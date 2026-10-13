import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { reviews } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';

export interface CreateReviewInput {
  order_id: string;
  kitchen_id: string;
  kitchen_name?: string;
  dish_id?: string;
  dish_name?: string;
  rating: number;
  comment?: string;
  consumer_id: string;
}

export class ReviewRepository {
  static async getByKitchen(kitchenId: string): Promise<any[]> {
    const rows = await db.select().from(reviews).where(eq(reviews.kitchenId, kitchenId)).orderBy(desc(reviews.createdAt));
    return rowsToSnakeCase<any>(rows);
  }

  static async findById(id: string): Promise<any | null> {
    const rows = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<any>(rows[0]) : null;
  }

  static async create(payload: CreateReviewInput): Promise<any> {
    const rows = await db
      .insert(reviews)
      .values({
        orderId: payload.order_id,
        kitchenId: payload.kitchen_id,
        kitchenName: payload.kitchen_name,
        dishId: payload.dish_id,
        dishName: payload.dish_name,
        rating: payload.rating,
        comment: payload.comment,
        consumerId: payload.consumer_id,
        customerId: payload.consumer_id,
      })
      .returning();
    return rowToSnakeCase<any>(rows[0]);
  }

  static async delete(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }
}
