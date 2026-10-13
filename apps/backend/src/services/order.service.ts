import { OrderRepository } from '../repositories/order.repository';
import { DishRepository } from '../repositories/dish.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { WeeklyDishRepository } from '../repositories/weeklyDish.repository';
import { AddonRepository } from '../repositories/addon.repository';
import { CartService } from './cart.service';
import { PricingService } from './pricing.service';
import { DeliveryMode, OrderStatus, OrderItem } from '../types/order';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors';
import { DishService } from './dish.service';
import { KitchenService } from './kitchen.service';

/**
 * Same formula as the mobile client's lib/priceUtils.ts#calculateBill, which
 * used to run entirely client-side before placeOrder wrote the result
 * straight into Supabase — ported verbatim rather than redesigned, so
 * today's actual pricing behavior doesn't silently change.
 *
 * Free-delivery threshold (₹200+) checked against listPrice — the list
 * price before the same-society discount is applied, per user decision.
 */
const FREE_DELIVERY_THRESHOLD = 200;

function calculateDirectOrderBill(params: { listPrice: number; sameSociety: boolean; deliveryMethod: 'PICKUP' | 'DELIVERY_PARTNER' }) {
  const { listPrice } = params;
  const discount = params.sameSociety ? Math.round(listPrice * 0.1) : 0;
  const deliveryFee = params.deliveryMethod === 'PICKUP' || listPrice >= FREE_DELIVERY_THRESHOLD
    ? 0
    : (params.sameSociety ? 10 : 35);
  const totalPayable = listPrice - discount + deliveryFee;
  return { listPrice, discount, deliveryFee, totalPayable };
}

export class OrderService {
  /**
   * "Buy now" checkout for one or more dishes from a single kitchen
   * (regular catalog dishes and/or weekly pre-bookings, mixed) — the
   * server-side replacement for apps/mobile/services/supabase/index.ts
   * #placeOrder, which computed pricing client-side and wrote directly to
   * Supabase with no server validation of price, stock, or kitchen status
   * at all.
   *
   * Previously took exactly one dish, so a multi-item cart checkout had to
   * call this once per item — creating N separate orders, each billed
   * (discount + delivery fee) from only its own item's price, instead of
   * one combined order for what the user experienced as a single checkout.
   * Confirmed directly: "checkout will be single order, why multiple
   * orders." Now takes an item array and creates exactly one order, with
   * one order_item row per dish, priced from the combined total.
   */
  static async createDirectOrder(profile_id: string, params: {
    kitchen_id: string;
    items: { dish_id: string; quantity: number; addon_ids?: string[] }[];
    consumer_society: string;
    delivery_method: 'PICKUP' | 'DELIVERY_PARTNER';
    delivery_address: string;
    allergy_tags: string[];
    allergy_other_text?: string;
  }) {
    if (params.items.length === 0) {
      throw new ValidationError('Order must contain at least one item.');
    }

    const kitchen = await KitchenRepository.findById(params.kitchen_id);
    if (!kitchen) throw new NotFoundError('Kitchen not found');
    if (kitchen.is_live === false) {
      throw new ValidationError('This kitchen is not currently accepting orders.');
    }

    // Resolve + validate every item BEFORE touching anything mutable (stock
    // decrements). A failure partway through must leave zero side effects,
    // not a half-decremented weekly dish backing an order that never gets
    // created.
    const resolvedItems: {
      dish_id: string;
      weekly_dish_id: string | null;
      dish_name: string;
      dish_price: number;
      quantity: number;
      is_weekly: boolean;
      addons: { id: string; name: string; price: number }[];
      addons_price_per_unit: number;
    }[] = [];

    for (const item of params.items) {
      let dishName: string;
      let dishPrice: number;
      let isWeeklyDish = false;

      const catalogDish = await DishRepository.findById(item.dish_id);
      if (catalogDish && catalogDish.kitchen_id === params.kitchen_id) {
        if (catalogDish.is_available === false) {
          throw new ValidationError(`${catalogDish.name} is no longer available.`);
        }
        dishName = catalogDish.name;
        dishPrice = catalogDish.price;
      } else {
        const weeklyDish = await WeeklyDishRepository.findById(item.dish_id);
        if (!weeklyDish) throw new NotFoundError('Dish not found');
        isWeeklyDish = true;
        dishName = weeklyDish.dish_name;
        dishPrice = weeklyDish.price;
      }

      // Add-ons are chef-authored per dish (dish_addons) — only ids are ever
      // accepted from the client; name/price are always looked up here,
      // never trusted, same principle as the dish price itself. Weekly
      // dishes don't support add-ons (dish_addons keys off the real
      // dishes.id, which a weekly dish doesn't have).
      let addonsSnapshot: { id: string; name: string; price: number }[] = [];
      let addonsPricePerUnit = 0;
      if (!isWeeklyDish && item.addon_ids && item.addon_ids.length > 0) {
        const realAddons = await AddonRepository.findByIds(item.addon_ids);
        const validAddons = realAddons.filter((a) => a.dish_id === item.dish_id);
        if (validAddons.length !== item.addon_ids.length) {
          throw new ValidationError('One or more selected add-ons are no longer available for this dish.');
        }
        addonsSnapshot = validAddons.map((a) => ({ id: a.id, name: a.name, price: a.price }));
        addonsPricePerUnit = validAddons.reduce((sum, a) => sum + a.price, 0);
      }

      resolvedItems.push({
        dish_id: item.dish_id,
        weekly_dish_id: isWeeklyDish ? item.dish_id : null,
        dish_name: dishName,
        dish_price: dishPrice,
        quantity: item.quantity,
        is_weekly: isWeeklyDish,
        addons: addonsSnapshot,
        addons_price_per_unit: addonsPricePerUnit,
      });
    }

    // Atomic, concurrency-safe stock checks — must happen before the order
    // is created so a failed decrement never leaves an order with no stock
    // backing it. Decrements already applied are rolled back if a later one
    // in the same checkout fails, so a 2-item order never partially reserves
    // stock for an order that doesn't end up existing.
    const decrementedSoFar: { dish_id: string; quantity: number }[] = [];
    try {
      for (const resolved of resolvedItems) {
        if (!resolved.is_weekly) continue;
        const decremented = await WeeklyDishRepository.decrementRemaining(resolved.dish_id, resolved.quantity);
        if (!decremented) {
          throw new ValidationError(`Not enough servings left for ${resolved.dish_name}.`);
        }
        decrementedSoFar.push({ dish_id: resolved.dish_id, quantity: resolved.quantity });
      }
    } catch (err) {
      for (const d of decrementedSoFar) {
        await WeeklyDishRepository.restoreRemaining(d.dish_id, d.quantity).catch(() => {});
      }
      throw err;
    }

    const listPrice = resolvedItems.reduce(
      (sum, r) => sum + (r.dish_price + r.addons_price_per_unit) * r.quantity,
      0
    );

    const sameSociety = (kitchen.address || '').toLowerCase().includes(params.consumer_society.toLowerCase());
    const bill = calculateDirectOrderBill({
      listPrice,
      sameSociety,
      deliveryMethod: params.delivery_method,
    });

    const order = await OrderRepository.createDirectOrder({
      customer_id: profile_id,
      kitchen_id: params.kitchen_id,
      delivery_method: params.delivery_method,
      delivery_fee: bill.deliveryFee,
      list_price: bill.listPrice,
      discount: bill.discount,
      total_paid: bill.totalPayable,
      delivery_address: params.delivery_address,
      allergy_tags: params.allergy_tags,
      allergy_other_text: params.allergy_other_text,
    });

    await OrderRepository.createOrderItems(resolvedItems.map((r) => ({
      order_id: order.id,
      dish_id: r.is_weekly ? null : r.dish_id,
      weekly_dish_id: r.weekly_dish_id,
      dish_name_snapshot: r.dish_name,
      price_at_order: r.dish_price,
      quantity: r.quantity,
      addons: r.addons,
    })));

    const orderSummary = resolvedItems.length === 1
      ? resolvedItems[0].dish_name
      : `${resolvedItems[0].dish_name} + ${resolvedItems.length - 1} more`;

    try {
      const { NotificationService } = require('./notification.service');
      if (kitchen.chef_user_id) {
        await NotificationService.sendNotification({
          profile_id: kitchen.chef_user_id,
          title: 'New Order Received!',
          message: `You have received a new order for ${orderSummary} (₹${bill.totalPayable}).`,
          type: 'CHEF_ALERT',
          entity_type: 'order',
          entity_id: order.id,
        });
      }
      await NotificationService.sendNotification({
        profile_id,
        title: 'Order Placed Successfully',
        message: `Your order for ₹${bill.totalPayable} has been placed.`,
        type: 'ORDER_UPDATE',
        entity_type: 'order',
        entity_id: order.id,
      });

      const { RealtimeService } = require('./realtime.service');
      await RealtimeService.broadcastEvent(`chef-orders:${params.kitchen_id}`, 'NEW_ORDER', order);
      await RealtimeService.broadcastEvent('ops-orders:all', 'NEW_ORDER', order);
    } catch (err) {
      console.error('Failed to send direct-order creation notifications', err);
    }

    return order;
  }

  static async createOrderFromCart(profile_id: string, delivery_mode: DeliveryMode) {
    const cartContext = await CartService.getCart(profile_id);
    
    if (cartContext.items.length === 0 || !cartContext.kitchen_id) {
      throw new ValidationError('Cart is empty');
    }

    const kitchenId = cartContext.kitchen_id;
    
    // Validate pickup support
    if (delivery_mode === 'PICKUP') {
      const kitchen = await KitchenService.getKitchenById(kitchenId);
      const pickupAvailable = kitchen.kitchen_info?.pickup_available !== false;
      if (!pickupAvailable) {
        throw new ValidationError('Pickup is not available for this kitchen');
      }
    } else {
      // Validate geofence for delivery
      // We assume delivery address is passed in or fetched from user's active address
      const { data: address } = await require('../config/supabase').supabase
        .from('addresses')
        .select('*')
        .eq('consumer_id', profile_id)
        .eq('is_default', true)
        .single();
        
      if (address) {
        const { DeliveryService } = require('./delivery.service');
        const isValid = await DeliveryService.validateGeofence(kitchenId, address.latitude, address.longitude);
        if (!isValid) {
          throw new ValidationError('Your address is outside the delivery radius for this kitchen');
        }
      }
    }

    // Double check dish availability & archiving before checkout
    for (const item of cartContext.items) {
      const dish = await DishService.getDishById(item.dish_id);
      if (!dish.is_available || dish.is_archived) {
        throw new ValidationError(`Dish ${dish.name} is no longer available`);
      }
    }

    // Calculate Pricing
    const pricing = await PricingService.calculateTotals(profile_id, kitchenId, cartContext.items, delivery_mode);

    // Create Order
    const order = await OrderRepository.createOrder({
      profile_id,
      kitchen_id: kitchenId,
      delivery_mode,
      ...pricing
    });

    // Create Order Items
    const orderItemsToInsert: Omit<OrderItem, 'id' | 'created_at'>[] = [];
    for (const item of cartContext.items) {
      const dish = await DishService.getDishById(item.dish_id);
      orderItemsToInsert.push({
        order_id: order.id,
        dish_id: item.dish_id,
        quantity: item.quantity,
        price_at_order: dish.price,
      });
    }

    await OrderRepository.createOrderItems(orderItemsToInsert);

    // Clear Cart
    await CartService.clearCart(profile_id);

    try {
      const { NotificationService } = require('./notification.service');
      // Alert the Chef
      const kitchen = await KitchenService.getKitchenById(kitchenId);
      await NotificationService.sendNotification({
        profile_id: kitchen.chef_user_id,
        title: 'New Order Received!',
        message: `You have received a new order (${delivery_mode}) for ₹${pricing.grand_total}`,
        type: 'CHEF_ALERT',
        entity_type: 'order',
        entity_id: order.id,
      });

      // Confirm to Consumer
      await NotificationService.sendNotification({
        profile_id: profile_id,
        title: 'Order Placed Successfully',
        message: `Your order for ₹${pricing.grand_total} has been placed.`,
        type: 'ORDER_UPDATE',
        entity_type: 'order',
        entity_id: order.id,
      });

      const { RealtimeService } = require('./realtime.service');
      await RealtimeService.broadcastEvent(`chef-orders:${kitchenId}`, 'NEW_ORDER', order);
      await RealtimeService.broadcastEvent('ops-orders:all', 'NEW_ORDER', order);
    } catch (err) {
      console.error('Failed to send order creation notifications', err);
    }

    return order;
  }

  static async getOrderById(id: string) {
    const order = await OrderRepository.getOrderById(id);
    if (!order) throw new NotFoundError('Order not found');
    const items = await OrderRepository.getOrderItems(id);
    const kitchen = order.kitchen_id ? await KitchenRepository.findById(order.kitchen_id).catch(() => null) : null;
    return { ...order, items, kitchen_name: kitchen?.name };
  }

  static async updateOrderStatus(id: string, status: OrderStatus, actor_role: string) {
    const order = await OrderRepository.getOrderById(id);
    if (!order) throw new NotFoundError('Order not found');

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'PENDING': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      'PLACED': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      'ACCEPTED': ['PREPARING'],
      'PREPARING': ['READY'],
      'READY': ['OUT_FOR_DELIVERY', 'DELIVERED'],
      'OUT_FOR_DELIVERY': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELLED': [],
      'REJECTED': []
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new ValidationError(`Invalid transition from ${order.status} to ${status}`);
    }

    // Basic role guards
    if (status === 'CANCELLED' && actor_role !== 'consumer' && actor_role !== 'admin') {
      throw new AuthorizationError('Only consumers or admins can cancel orders');
    }
    
    if (['ACCEPTED', 'REJECTED', 'PREPARING', 'READY'].includes(status) && actor_role !== 'chef' && actor_role !== 'admin') {
      throw new AuthorizationError('Only chefs or admins can manage order preparation');
    }

    const updated = await OrderRepository.updateOrderStatus(id, status);

    // Weekly-dish quantity was never restored on cancellation — decrementRemaining
    // (order placement) has no counterpart here, so every cancelled weekly
    // booking permanently lost that stock even though no one ended up eating it.
    if (status === 'CANCELLED') {
      try {
        const items = await OrderRepository.getOrderItems(id);
        for (const item of items) {
          if (item.weekly_dish_id) {
            await WeeklyDishRepository.restoreRemaining(item.weekly_dish_id, item.quantity);
          }
        }
      } catch (restoreErr) {
        console.error('Failed to restore weekly-dish quantity on cancellation:', restoreErr);
      }
    }

    // Module 2: If order is CANCELLED, trigger financial cancellation flow automatically
    if (status === 'CANCELLED' && (order.payment_status === 'paid' || order.payment_status === 'CAPTURED' || order.payment_status === 'SUCCESS')) {
      try {
        const { RefundService } = require('./refund.service');
        await RefundService.processRefund({
          order_id: id,
          amount: Number(order.grand_total || order.total_paid || 0),
          reason: `Order Cancelled by ${actor_role}`,
          type: 'FULL',
          actor_id: actor_role,
        });
      } catch (refundErr) {
        console.error('Failed to execute automatic financial refund during order cancellation:', refundErr);
      }
    }

    // Trigger Notification and Realtime Broadcast
    try {
      const { NotificationService } = require('./notification.service');
      const { RealtimeService } = require('./realtime.service');
      
      await NotificationService.sendNotification({
        profile_id: order.profile_id,
        title: 'Order Update',
        message: `Your order status has been updated to ${status}`,
        type: 'ORDER_STATUS',
        entity_type: 'order',
        entity_id: order.id,
      });

      await RealtimeService.broadcastEvent(`order:${order.id}`, 'ORDER_STATUS_UPDATED', updated);
      // Previously these two relied on Supabase's postgres_changes firing on
      // ANY change to the orders table — Socket.io has no equivalent
      // table-level trigger, so the list-level subscriptions
      // (subscribeToChefOrders/subscribeToOpsOrders) need an explicit emit.
      if (order.kitchen_id) {
        await RealtimeService.broadcastEvent(`chef-orders:${order.kitchen_id}`, 'ORDER_UPDATED', updated);
      }
      await RealtimeService.broadcastEvent('ops-orders:all', 'ORDER_UPDATED', updated);

      // Phase 10: Trigger Reward processing via Event Bus
      if (status === 'DELIVERED') {
        const { internalEventBus, EVENTS } = require('../events/eventEmitter');
        internalEventBus.emit(EVENTS.ORDER_COMPLETED, updated);
      }

      // Phase 11: Trigger Delivery Assignment
      if (status === 'READY') {
        const { internalEventBus, EVENTS } = require('../events/eventEmitter');
        internalEventBus.emit(EVENTS.ORDER_READY, updated);
      }
    } catch (err) {
      console.error('Failed to dispatch notifications for order update', err);
    }

    return updated;
  }


  static async getConsumerHistory(profile_id: string) {
    return OrderRepository.getConsumerHistory(profile_id);
  }

  static async getKitchenHistory(kitchen_id: string) {
    return OrderRepository.getKitchenHistory(kitchen_id);
  }

  static async searchOrdersExtended(params: any) {
    return OrderRepository.searchOrdersExtended(params);
  }

  static async getOrderFinancialSummary(order_id: string) {
    return OrderRepository.getOrderFinancialSummary(order_id);
  }

  static async updatePaymentStatus(id: string, payment_status: any, admin_id: string) {
    const updated = await OrderRepository.updatePaymentStatus(id, payment_status);
    const { CrmService } = require('./crm.service');
    await CrmService.logAction(admin_id, `UPDATE_ORDER_PAYMENT_STATUS_${payment_status}`, 'order', id);
    return updated;
  }

  static async updateSettlementStatus(id: string, settlement_status: any, admin_id: string) {
    const updated = await OrderRepository.updateSettlementStatus(id, settlement_status);
    const { CrmService } = require('./crm.service');
    await CrmService.logAction(admin_id, `UPDATE_ORDER_SETTLEMENT_STATUS_${settlement_status}`, 'order', id);
    return updated;
  }
}

