import { CartItem } from '../types/cart';
import { DeliveryMode } from '../types/order';
import { DishService } from './dish.service';
import { ProfileService } from './profile.service';
import { KitchenService } from './kitchen.service';

export interface PricingResult {
  item_total: number;
  discount_amount: number;
  delivery_fee: number;
  taxes: number; // Placeholder
  platform_fee: number; // Placeholder
  grand_total: number;
}

export class PricingService {
  static async calculateTotals(
    consumer_profile_id: string,
    kitchen_id: string,
    items: CartItem[],
    delivery_mode: DeliveryMode
  ): Promise<PricingResult> {
    
    // Calculate Item Total
    let item_total = 0;
    for (const item of items) {
      const dish = await DishService.getDishById(item.dish_id);
      item_total += dish.price * item.quantity;
    }

    // Check for Same Society Discount
    let discount_amount = 0;
    const consumer = await ProfileService.getProfileById(consumer_profile_id);
    const kitchen = await KitchenService.getKitchenById(kitchen_id);
    const chefProfile = await ProfileService.getProfileById(kitchen.chef_user_id);

    if (consumer.society_id && chefProfile.society_id && consumer.society_id === chefProfile.society_id) {
      // 10% discount if from the same society
      discount_amount = Math.round(item_total * 0.10);
    }

    // Calculate Delivery Fee (rupees, same unit as item_total/grand_total —
    // this previously used 1000 as if it were paise, which inflated every
    // delivery order's grand_total by ~₹990). Matches the mobile client's
    // same-society delivery pricing in apps/mobile/lib/priceUtils.ts, including
    // the ₹200+ free-delivery threshold (checked against item_total, before
    // the same-society discount, per user decision).
    let delivery_fee = 0;
    if (delivery_mode === 'DELIVERY' && item_total < 200) {
      const sameSociety = consumer.society_id && chefProfile.society_id && consumer.society_id === chefProfile.society_id;
      delivery_fee = sameSociety ? 10 : 35;
    }

    // Placeholders
    const taxes = 0;
    const platform_fee = 0;

    const grand_total = item_total - discount_amount + delivery_fee + taxes + platform_fee;

    return {
      item_total,
      discount_amount,
      delivery_fee,
      taxes,
      platform_fee,
      grand_total
    };
  }
}
