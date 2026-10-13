import type { PartyMenu, PartyOrderSelection, Order, ChefOrder } from '../../types';
import { mockOrders, mockChefOrders } from './index';
import { sendPartyOrderPlacedNotificationToChef } from '../notifications';
import { pubsub } from '../../lib/pubsub';

const DEFAULT_PARTY_MENU: PartyMenu = {
  kitchenId: 'kavita',
  isEnabled: true,
  minGuests: 8,
  advanceNoticeHours: 48,
  packages: [
    {
      id: 'dawaat',
      name: 'DAWAAT',
      pricePerHead: 280,
      categoryCaps: { starters: 2, mains: 3, breads: 1, sweets: 1 },
      description: '2 starters, 2-3 main course, Bread, rice, 1 sweet',
    },
    {
      id: 'jalsa',
      name: 'JALSA',
      pricePerHead: 450,
      isPopular: true,
      categoryCaps: { starters: 3, mains: 4, breads: 1, sweets: 2 },
      description: '3 starters, 4 main course, Bread, rice, 2 sweets',
    },
  ],
  dishes: [
    // Starters
    { id: 'p1', name: 'Paneer tikka', category: 'Starters', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p2', name: 'Corn seekh kebab', category: 'Starters', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p3', name: 'Chicken malai tikka', category: 'Starters', extraChargePerHead: 40, isAvailable: true, isVeg: false },
    { id: 'p4', name: 'Veg Spring Roll', category: 'Starters', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p4a', name: 'Hara Bhara Kebab', category: 'Starters', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p4b', name: 'Dahi Ke Kebab', category: 'Starters', extraChargePerHead: 20, isAvailable: true, isVeg: true },
    { id: 'p4c', name: 'Fish Amritsari', category: 'Starters', extraChargePerHead: 50, isAvailable: true, isVeg: false },
    // Mains
    { id: 'p5', name: 'Dal Makhani', category: 'Mains', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p6', name: 'Paneer Butter Masala', category: 'Mains', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p7', name: 'Chicken Curry', category: 'Mains', extraChargePerHead: 30, isAvailable: true, isVeg: false },
    { id: 'p8', name: 'Veg Biryani', category: 'Mains', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p8a', name: 'Kadhai Paneer', category: 'Mains', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p8b', name: 'Malai Kofta', category: 'Mains', extraChargePerHead: 15, isAvailable: true, isVeg: true },
    { id: 'p8c', name: 'Mutton Rogan Josh', category: 'Mains', extraChargePerHead: 80, isAvailable: true, isVeg: false },
    // Breads
    { id: 'p9', name: 'Butter Naan', category: 'Breads', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p10', name: 'Tandoori Roti', category: 'Breads', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p10a', name: 'Garlic Naan', category: 'Breads', extraChargePerHead: 10, isAvailable: true, isVeg: true },
    { id: 'p10b', name: 'Laccha Paratha', category: 'Breads', extraChargePerHead: 15, isAvailable: true, isVeg: true },
    // Sweets
    { id: 'p11', name: 'Gulab jamun', category: 'Sweets', extraChargePerHead: 0, isAvailable: true, isVeg: true },
    { id: 'p12', name: 'Rasmalai', category: 'Sweets', extraChargePerHead: 20, isAvailable: true, isVeg: true },
    { id: 'p12a', name: 'Gajar Ka Halwa', category: 'Sweets', extraChargePerHead: 15, isAvailable: true, isVeg: true },
    { id: 'p12b', name: 'Moong Dal Halwa', category: 'Sweets', extraChargePerHead: 25, isAvailable: true, isVeg: true },
  ],
};

const partyMenusStore: Record<string, PartyMenu> = {
  kavita: DEFAULT_PARTY_MENU,
  'kitchen-1': DEFAULT_PARTY_MENU,
};

export async function getPartyMenu(kitchenId: string): Promise<PartyMenu> {
  return partyMenusStore[kitchenId] || { ...DEFAULT_PARTY_MENU, kitchenId };
}

export async function savePartyMenu(kitchenId: string, partyMenu: PartyMenu): Promise<PartyMenu> {
  partyMenusStore[kitchenId] = partyMenu;
  return partyMenu;
}

export async function getPartyKitchens(): Promise<{ kitchenId: string; kitchenName: string; society?: string; rating?: number; minGuests: number; minPricePerHead: number }[]> {
  return [];
}

export async function placePartyOrder(sel: PartyOrderSelection): Promise<Order> {
  const orderId = `party_${Date.now()}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderId,
    kitchenId: sel.kitchenId,
    dishId: 'party_pack',
    kitchenName: sel.kitchenName,
    dishName: `Party Mode (${sel.packName} Pack)`,
    quantity: sel.guestCount,
    listAmount: sel.basePricePerHead * sel.guestCount,
    societyDiscount: 0,
    deliveryFee: 0,
    total: sel.totalAmount,
    status: 'placed',
    eta: sel.bookingDate,
    createdAt: now,
    allergyInfo: sel.allergyInfo || { tags: [], otherText: '' },
    delivery: {
      method: 'DELIVERY_PARTNER',
      fee: 0,
      deliveryAddress: {
        address: sel.deliveryAddress || 'Flat 402, Lotus Heights',
        estimatedDeliveryTime: sel.bookingDate,
      },
    },
    isPartyOrder: true,
    partyBookingDate: sel.bookingDate,
    guestCount: sel.guestCount,
    selectedPackName: sel.packName,
    perHeadPrice: sel.totalPerHead,
    partyDishes: sel.selectedDishes.map((d) => ({
      name: d.name,
      category: d.category,
      extraChargePerHead: d.extraChargePerHead,
    })),
    paymentStatus: 'PENDING',
  };

  mockOrders.unshift(newOrder);

  const chefOrder: ChefOrder = {
    id: orderId,
    dish: `Party Mode (${sel.packName} Pack - ${sel.guestCount} guests)`,
    dishId: 'party_pack',
    customer: 'Sakshi (Consumer)',
    society: 'Lotus Heights',
    amount: sel.totalAmount,
    status: 'Placed',
    urgent: true,
    createdAt: now,
    allergyInfo: sel.allergyInfo || { tags: [], otherText: '' },
    delivery: newOrder.delivery,
    isPartyOrder: true,
    partyBookingDate: sel.bookingDate,
    guestCount: sel.guestCount,
    selectedPackName: sel.packName,
    perHeadPrice: sel.totalPerHead,
    partyDishes: newOrder.partyDishes,
    paymentStatus: 'PENDING',
  };

  mockChefOrders.unshift(chefOrder);

  sendPartyOrderPlacedNotificationToChef(sel.guestCount, sel.totalAmount, new Date(sel.bookingDate).toLocaleDateString());

  pubsub.publish('chef-orders:kavita', chefOrder);
  pubsub.publish(`order:${orderId}`, newOrder);

  return newOrder;
}
