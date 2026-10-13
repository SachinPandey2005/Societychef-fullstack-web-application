import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { carts, cartItems } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import { Cart, CartItem } from '../types/cart';

// carts/cart_items never existed (confirmed absent from the live schema
// dump). This is the backend's own server-side cart, feeding directly into
// OrderService.createOrderFromCart (POST /orders/checkout) — already
// confirmed broken for unrelated column-name reasons (see the
// order.repository.ts conversion), and would have failed even earlier here
// at CartService.getCart, before ever reaching order creation. Created via
// supabase/local/021_cart_tables.sql.
export class CartRepository {
  static async findOrCreateCart(profile_id: string): Promise<Cart> {
    const existing = await db.select().from(carts).where(eq(carts.profileId, profile_id)).limit(1);
    if (existing[0]) return rowToSnakeCase<Cart>(existing[0]);

    const created = await db.insert(carts).values({ profileId: profile_id, kitchenId: null }).returning();
    return rowToSnakeCase<Cart>(created[0]);
  }

  static async updateCartKitchen(cart_id: string, kitchen_id: string | null): Promise<void> {
    await db.update(carts).set({ kitchenId: kitchen_id }).where(eq(carts.id, cart_id));
  }

  static async getCartItems(cart_id: string): Promise<CartItem[]> {
    const rows = await db.select().from(cartItems).where(eq(cartItems.cartId, cart_id));
    return rowsToSnakeCase<CartItem>(rows);
  }

  static async findCartItem(cart_id: string, dish_id: string): Promise<CartItem | null> {
    const rows = await db.select().from(cartItems).where(and(eq(cartItems.cartId, cart_id), eq(cartItems.dishId, dish_id))).limit(1);
    return rows[0] ? rowToSnakeCase<CartItem>(rows[0]) : null;
  }

  static async findCartItemById(item_id: string): Promise<CartItem | null> {
    const rows = await db.select().from(cartItems).where(eq(cartItems.id, item_id)).limit(1);
    return rows[0] ? rowToSnakeCase<CartItem>(rows[0]) : null;
  }

  static async addItem(cart_id: string, dish_id: string, quantity: number): Promise<CartItem> {
    const rows = await db.insert(cartItems).values({ cartId: cart_id, dishId: dish_id, quantity }).returning();
    return rowToSnakeCase<CartItem>(rows[0]);
  }

  static async updateItemQuantity(item_id: string, quantity: number): Promise<CartItem> {
    const rows = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, item_id)).returning();
    return rowToSnakeCase<CartItem>(rows[0]);
  }

  static async removeItem(item_id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, item_id));
  }

  static async clearCartItems(cart_id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart_id));
  }
}
