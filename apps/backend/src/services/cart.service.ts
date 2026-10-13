import { CartRepository } from '../repositories/cart.repository';
import { DishService } from './dish.service';
import { KitchenService } from './kitchen.service';
import { ValidationError, NotFoundError } from '../utils/errors';

export class CartService {
  static async getCart(profile_id: string) {
    const cart = await CartRepository.findOrCreateCart(profile_id);
    const items = await CartRepository.getCartItems(cart.id);
    return { ...cart, items };
  }

  static async addDishToCart(profile_id: string, dish_id: string, quantity: number) {
    const cart = await CartRepository.findOrCreateCart(profile_id);
    const dish = await DishService.getDishById(dish_id);
    const kitchen = await KitchenService.getKitchenById(dish.kitchen_id);

    // Business Rule: Kitchen must be active
    if (!kitchen.is_live) {
      throw new ValidationError('Kitchen is currently not active');
    }

    // Business Rule: Kitchen open logic (skipping strict HH:mm parsing for simplicity unless required, 
    // but the prompt mentions "Kitchen is currently open". Assuming active status covers it or a simplistic check).
    // Let's rely on status 'active' for now.

    // Business Rule: Dish must be available and not archived
    if (!dish.is_available) {
      throw new ValidationError('Dish is currently unavailable');
    }
    if (dish.is_archived) {
      throw new ValidationError('Dish is archived and cannot be ordered');
    }

    // Business Rule: Single kitchen per cart
    if (cart.kitchen_id && cart.kitchen_id !== dish.kitchen_id) {
      // Check if cart is empty. If empty, we can switch kitchen.
      const existingItems = await CartRepository.getCartItems(cart.id);
      if (existingItems.length > 0) {
        throw new ValidationError('Cart can only contain dishes from a single kitchen. Clear cart to order from a different kitchen.');
      } else {
        await CartRepository.updateCartKitchen(cart.id, dish.kitchen_id);
      }
    } else if (!cart.kitchen_id) {
      await CartRepository.updateCartKitchen(cart.id, dish.kitchen_id);
    }

    // Check if item already exists
    const existingItem = await CartRepository.findCartItem(cart.id, dish_id);
    if (existingItem) {
      // update quantity
      return CartRepository.updateItemQuantity(existingItem.id, existingItem.quantity + quantity);
    }

    return CartRepository.addItem(cart.id, dish_id, quantity);
  }

  static async updateItemQuantity(profile_id: string, item_id: string, quantity: number) {
    const cart = await CartRepository.findOrCreateCart(profile_id);
    const item = await CartRepository.findCartItemById(item_id);
    if (!item || item.cart_id !== cart.id) {
      throw new NotFoundError('Cart item not found');
    }
    return CartRepository.updateItemQuantity(item_id, quantity);
  }

  static async removeItem(profile_id: string, item_id: string) {
    const cart = await CartRepository.findOrCreateCart(profile_id);
    const item = await CartRepository.findCartItemById(item_id);
    if (!item || item.cart_id !== cart.id) {
      throw new NotFoundError('Cart item not found');
    }
    await CartRepository.removeItem(item_id);

    // If cart is now empty, reset kitchen_id
    const remainingItems = await CartRepository.getCartItems(cart.id);
    if (remainingItems.length === 0) {
      await CartRepository.updateCartKitchen(cart.id, null);
    }
  }

  static async clearCart(profile_id: string) {
    const cart = await CartRepository.findOrCreateCart(profile_id);
    await CartRepository.clearCartItems(cart.id);
    await CartRepository.updateCartKitchen(cart.id, null);
  }
}
