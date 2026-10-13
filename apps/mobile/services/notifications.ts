import { Platform } from 'react-native';
import { useNotificationStore } from '../store/useNotificationStore';
import type { OrderStatus } from '../types';

export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, any>;
};

const STATUS_TITLES: Record<string, string> = {
  accepted: '🍳 Order Accepted!',
  preparing: '🔥 Meal Being Prepared!',
  ready: '📦 Order Ready for Delivery/Pickup!',
  out_for_delivery: '🛵 Rider Out for Delivery!',
  delivered: '🎉 Order Delivered!',
  cancelled: '❌ Order Cancelled',
};

const STATUS_MESSAGES: Record<string, string> = {
  accepted: 'The chef has accepted your pre-order and is getting ingredients ready.',
  preparing: 'Your homestyle meal is freshly cooking in the kitchen station.',
  ready: 'Your meal is packed and ready! Courier will arrive shortly.',
  out_for_delivery: 'Our delivery partner is on the way to your flat.',
  delivered: 'Enjoy your fresh meal! Don\'t forget to leave a review.',
  cancelled: 'Your pre-order has been cancelled and availability restored.',
};

/**
 * Sends in-app and push notification for order status updates.
 */
export async function sendOrderStatusNotification(orderId: string, status: string): Promise<void> {
  const title = STATUS_TITLES[status] || `Order ${status.toUpperCase()}`;
  const body = STATUS_MESSAGES[status] || `Your order status has been updated to ${status}.`;

  // Add to local notification store for badge & feed display
  useNotificationStore.getState().addNotification({
    title,
    body,
    type: 'order_update',
    icon: 'notifications-outline',
    tone: 'blue',
  });
}

/**
 * Sends notification to chef when a new order arrives.
 */
export async function sendNewOrderNotificationToChef(kitchenName: string, orderId: string, amount: number): Promise<void> {
  useNotificationStore.getState().addNotification({
    title: '🔔 New Order Received!',
    body: `New pre-order #${orderId} for ₹${amount} received in ${kitchenName}.`,
    type: 'chef_order',
    icon: 'fast-food-outline',
    tone: 'green',
  });
}

/**
 * Sends notification when a dish sells out.
 */
export async function sendSoldOutNotificationToChef(dishName: string): Promise<void> {
  useNotificationStore.getState().addNotification({
    title: '⚠️ Portion Cap Reached!',
    body: `"${dishName}" is now Sold Out! You can restock portions anytime in your weekly schedule.`,
    type: 'chef_order',
    icon: 'alert-circle-outline',
    tone: 'gold',
  });
}

/**
 * Sends notification to consumer when chef accepts party booking.
 */
export async function sendPartyOrderAcceptedNotification(kitchenName: string, bookingDateStr: string): Promise<void> {
  useNotificationStore.getState().addNotification({
    title: '🎉 Party Booking Accepted! Action Required',
    body: `${kitchenName} accepted your pre-booking for ${bookingDateStr}. Tap here to Pay Now and lock in your booking!`,
    type: 'order_update',
    icon: 'card-outline',
    tone: 'gold',
    actionRoute: '/(consumer)/orders',
  });
}

/**
 * Sends notification to chef when a party pre-booking arrives.
 */
export async function sendPartyOrderPlacedNotificationToChef(guestCount: number, amount: number, bookingDateStr: string): Promise<void> {
  useNotificationStore.getState().addNotification({
    title: '🔔 New Party Pre-Booking Request!',
    body: `New bulk party pre-order for ${guestCount} guests (₹${amount}) requested for ${bookingDateStr}.`,
    type: 'chef_order',
    icon: 'people-outline',
    tone: 'gold',
    actionRoute: '/(chef)/orders',
  });
}

/**
 * Sends suggestion notification to consumer if next day order is missing in weekly plan.
 */
export async function sendMissingDayOrderReminder(orderedDay: string, nextDay: string, lastDishName?: string): Promise<void> {
  const repeatText = lastDishName ? ` or repeat your last order (${lastDishName})!` : '!';
  useNotificationStore.getState().addNotification({
    title: `🍱 Forgot food for ${nextDay}?`,
    body: `You've scheduled your meal for ${orderedDay}, but haven't ordered for ${nextDay} yet. Tap to order now${repeatText}`,
    type: 'order_update',
    icon: 'calendar-outline',
    tone: 'gold',
    actionRoute: '/(consumer)/weekly',
  });
}
