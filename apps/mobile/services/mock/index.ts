import { DISHES, INITIAL_CHEF_DISHES, KITCHENS, SUPPLIES } from '../../constants/data';
import { calculateBill } from '../../lib/priceUtils';
import { pubsub } from '../../lib/pubsub';
import { sendOrderStatusNotification, sendNewOrderNotificationToChef, sendSoldOutNotificationToChef } from '../notifications';
import { calculateSettlementBreakdown } from '../payments';
import { useAuthStore } from '../../store/useAuthStore';
import type {
  AllergyInfo,
  ChefDish,
  ChefOrder,
  DeliveryDetails,
  Dish,
  Kitchen,
  KitchenDish,
  KitchenMedia,
  Message,
  Order,
  Supply,
  WeeklyMenu,
} from '../../types';


function delay<T>(value: T): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), 300));
}

export async function getActiveChefProfileId(): Promise<string> {
  const user = useAuthStore.getState().user;
  return user?.chefProfileId || 'kavita';
}

// Local mock state for synchronization
let mockDishes: Dish[] = [...DISHES];
let mockKitchens: Kitchen[] = [...KITCHENS];
let mockChefDishes: Record<string, ChefDish> = {};

export async function getListings(
  consumerSociety: string,
  query?: string,
  quickFilter?: string,
): Promise<{ kitchen: Kitchen; item: KitchenDish; dish: Dish }[]> {
  const normalizedQuery = (query ?? '').trim().toLowerCase();

  const results = mockKitchens.flatMap((kitchen) =>
    kitchen.dishes.map((item) => ({
      kitchen,
      item,
      dish: mockDishes.find((d) => d.id === item.dishId)!,
    })),
  )
    .filter(({ kitchen, item, dish }) => {
      if (!dish) return false;
      const text =
        `${kitchen.name} ${(kitchen as any).chefName || (kitchen as any).chef_name || ''} ${kitchen.society} ${dish.name} ${dish.category}`.toLowerCase();
      if (normalizedQuery && !text.includes(normalizedQuery)) return false;
      if (quickFilter === 'Same society' && kitchen.society !== consumerSociety) return false;
      if (quickFilter === 'Weekly free' && !item.weeklyFree) return false;
      if (quickFilter === 'Free sample' && !item.sample) return false;
      if (quickFilter === 'Fast' && item.leadTimeMinutes > 90) return false;
      return true;
    })
    .sort((a, b) => {
      const sameA = a.kitchen.society === consumerSociety ? 0 : 1;
      const sameB = b.kitchen.society === consumerSociety ? 0 : 1;
      return (
        sameA - sameB ||
        a.kitchen.distanceKm - b.kitchen.distanceKm ||
        a.item.leadTimeMinutes - b.item.leadTimeMinutes
      );
    });

  return delay(results);
}

export async function getKitchen(id: string): Promise<Kitchen | null> {
  const user = useAuthStore.getState().user;
  const isOwnChefRequest = !id || id === user?.id || id === user?.chefProfileId || (user?.role === 'chef' && id === 'kavita');

  // For the logged-in chef viewing their own kitchen profile/dashboard
  if (user && isOwnChefRequest) {
    const dynamicDishes = Object.values(mockChefDishes);
    const dynamicKitchen: Kitchen = {
      id: user.chefProfileId || user.id,
      name: user.displayName ? (user.displayName.includes('Kitchen') ? user.displayName : `${user.displayName}'s Kitchen`) : 'My Kitchen',
      chefName: user.displayName || 'Chef',
      society: user.society || '',
      tower: user.tower || '',
      flat: user.flat || '',
      address: [user.society, user.tower, user.flat].filter(Boolean).join(', '),
      distanceKm: 0.5,
      rating: 5.0,
      orders: mockChefOrders.length,
      anonymous: false,
      hygieneBadge: true,
      isLive: true,
      coverImage: user.coverImage,
      profileImage: user.avatarUrl,
      storyPrompts: [],
      gallery: [],
      videos: [],
      hygieneDetails: [],
      hygienePhotos: [],
      hygieneVideos: [],
      trustBadges: [],
      kitchenInfo: {
        cuisine: 'Indian Homestyle',
        experience: 'Home Chef',
        prepTime: '45 mins',
        deliveryTime: '30 mins',
        operatingHours: '9 AM - 9 PM',
        languages: 'English, Hindi',
        society: user.society || '',
      },
      stats: { ordersCompleted: mockChefOrders.filter(o => o.status === 'Delivered').length, responseTime: '15 mins' },
      dishes: dynamicDishes.map((cd) => ({
        dishId: cd.id,
        name: cd.name,
        price: cd.price,
        leadTimeMinutes: cd.leadTimeMinutes,
        weeklyFree: cd.weeklyFree || false,
        sample: cd.sample || false,
        available: 'Daily',
        isEnabled: cd.enabled,
      })),
    };
    return delay(dynamicKitchen);
  }

  const targetId = id || user?.chefProfileId || user?.id;
  const kitchen = mockKitchens.find((k) => k.id === targetId || (k as any).chefUserId === targetId);
  if (kitchen) {
    return delay(kitchen);
  }

  return delay(mockKitchens[0]);
}

export async function getDish(id: string): Promise<Dish | null> {
  const staticDish = DISHES.find((d) => d.id === id);
  if (staticDish) return delay(staticDish);

  const weeklyDish = mockWeeklyDishes.find((wd) => wd.id === id);
  if (weeklyDish) {
    return delay({
      id: weeklyDish.id,
      name: weeklyDish.dishName,
      category: weeklyDish.foodType === 'NonVeg' ? 'Non-Veg' : 'Veg',
      description: weeklyDish.description || '',
      price: weeklyDish.price,
    } as any);
  }

  const fallback = DISHES.find((d) => d.id.includes(id) || id.includes(d.id));
  return delay(fallback ?? DISHES[0]);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const orders = await getOrders('');
  return orders.find(o => o.id === orderId) ?? null;
}

export let mockOrders: Order[] = [];

export async function getOrders(_userId: string): Promise<Order[]> {
  return delay([...mockOrders]);
}

export let mockChefOrders: ChefOrder[] = [];

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  const order = mockOrders.find(o => o.id === orderId);
  if (order) {
    order.status = status.toLowerCase() as any;
    pubsub.publish(`order:${orderId}`, order);
  }

  const chefOrder = mockChefOrders.find(o => o.id === orderId);
  if (chefOrder) {
    chefOrder.status = normalizedStatus;
    pubsub.publish(`chef-orders:${chefOrder.id}`, chefOrder);
  }

  // Also publish to general dashboard update channels
  pubsub.publish('chef-orders:kavita', order || chefOrder);
  pubsub.publish('ops-orders:all', order || chefOrder);

  return delay(undefined);
}

export async function addMorePartyPacks(
  orderId: string,
  additionalCount: number,
  perHeadPrice: number,
  isAccepted: boolean = true
): Promise<{ additionalCount: number; ratePerPack: number; addonTotal: number; newTotal: number }> {
  // Rate per pack includes 10% extra fee per person ONLY if order has already been accepted by chef
  const ratePerPack = isAccepted ? Math.round(perHeadPrice * 1.10) : perHeadPrice;
  const addonTotal = ratePerPack * additionalCount;

  const order = mockOrders.find((o) => o.id === orderId);
  if (order) {
    order.guestCount = (order.guestCount || 10) + additionalCount;
    order.quantity = order.guestCount;
    order.total = order.total + addonTotal;
    pubsub.publish(`order:${orderId}`, order);
  }

  const chefOrder = mockChefOrders.find((o) => o.id === orderId);
  if (chefOrder) {
    chefOrder.guestCount = (chefOrder.guestCount || 10) + additionalCount;
    chefOrder.amount = chefOrder.amount + addonTotal;
    pubsub.publish(`chef-orders:${chefOrder.id}`, chefOrder);
  }

  return delay({
    additionalCount,
    ratePerPack,
    addonTotal,
    newTotal: order ? order.total : addonTotal,
  });
}

export async function cancelOrder(orderId: string): Promise<void> {
  const order = mockOrders.find((o) => o.id === orderId);
  if (order) {
    if (order.status !== 'placed') {
      throw new Error('Only pending orders in placed status can be cancelled.');
    }
    order.status = 'cancelled';
    pubsub.publish(`order:${orderId}`, order);

    // Restore dish quantity if weekly dish
    const weeklyDish = mockWeeklyDishes.find((wd) => wd.id === order.dishId);
    if (weeklyDish) {
      weeklyDish.remainingQuantity += order.quantity;
      if (weeklyDish.remainingQuantity > 0 && weeklyDish.status === 'sold_out') {
        weeklyDish.status = 'active';
      }
    }
  }

  const chefOrder = mockChefOrders.find((o) => o.id === orderId);
  if (chefOrder) {
    chefOrder.status = 'Cancelled';
    pubsub.publish(`chef-orders:${chefOrder.id}`, chefOrder);
  }

  sendOrderStatusNotification(orderId, 'cancelled');

  pubsub.publish('chef-orders:kavita', order || chefOrder);
  return delay(undefined);
}

export async function getChefOrders(): Promise<ChefOrder[]> {
  return delay([...mockChefOrders]);
}

export async function placeOrder(params: {
  kitchenId: string;
  items: { dishId: string; quantity: number; addonIds?: string[] }[];
  consumerSociety: string;
  allergyInfo: AllergyInfo;
  delivery: DeliveryDetails;
  note?: string;
}): Promise<Order> {
  const foundKitchen = KITCHENS.find((k) => k.id === params.kitchenId);
  let kitchenName = foundKitchen ? foundKitchen.name : (params.kitchenId
    ? params.kitchenId.replace(/-kitchen$/i, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + "'s Kitchen"
    : 'Home Kitchen');
  let kitchenId = foundKitchen ? foundKitchen.id : params.kitchenId;

  // Mirrors OrderService.createDirectOrder — one combined order across all
  // items, not one per item (mock-mode equivalent of the same fix).
  let listAmount = 0;
  let firstDishName = 'Special Dish';
  let firstDishId = params.items[0]?.dishId || 'dish';
  const soldOutDishNames: string[] = [];

  for (const item of params.items) {
    let price = 140;
    let dishName = 'Special Dish';
    let resolvedDishId = item.dishId;

    const weeklyDish = mockWeeklyDishes.find((wd) => wd.id === item.dishId || wd.dishName.toLowerCase() === item.dishId.toLowerCase());
    if (weeklyDish) {
      if (weeklyDish.remainingQuantity < item.quantity) {
        throw new Error('Not enough quantity available');
      }
      weeklyDish.remainingQuantity -= item.quantity;
      if (weeklyDish.remainingQuantity <= 0) {
        weeklyDish.status = 'sold_out';
        soldOutDishNames.push(weeklyDish.dishName);
      }
      price = weeklyDish.price;
      dishName = weeklyDish.dishName;
      resolvedDishId = weeklyDish.id;
      if (weeklyDish.kitchenName) {
        kitchenName = weeklyDish.kitchenName;
      }
    } else {
      const kitchenDish = foundKitchen?.dishes.find((d) => d.dishId === item.dishId);
      const dish = DISHES.find((d) => d.id === item.dishId || d.name.toLowerCase().includes(item.dishId.toLowerCase()));
      if (kitchenDish) price = kitchenDish.price;
      if (dish) {
        dishName = dish.name;
        resolvedDishId = dish.id;
      } else if (kitchenDish) {
        dishName = 'Chef Special';
      }
    }

    listAmount += price * item.quantity;
    if (item === params.items[0]) {
      firstDishName = dishName;
      firstDishId = resolvedDishId;
    }
  }

  const dishName = params.items.length > 1 ? `${firstDishName} + ${params.items.length - 1} more` : firstDishName;
  const dishId = firstDishId;
  const quantity = params.items.reduce((sum, i) => sum + i.quantity, 0);

  const sameSociety = (foundKitchen?.society || 'Lotus Heights').toLowerCase() === params.consumerSociety.toLowerCase();
  const societyDiscount = sameSociety ? Math.round(listAmount * 0.1) : 0;
  const deliveryFee = listAmount >= 200 ? 0 : (sameSociety ? 10 : 35);
  const total = listAmount - societyDiscount + deliveryFee;
  const orderId = `HC-${Math.floor(1100 + Math.random() * 700)}`;

  const order: Order = {
    id: orderId,
    kitchenId: kitchenId,
    dishId,
    kitchenName: kitchenName,
    dishName,
    quantity,
    allergyInfo: params.allergyInfo,
    listAmount,
    societyDiscount,
    deliveryFee,
    total,
    status: 'placed',
    eta: 'Tonight',
    createdAt: new Date().toISOString(),
    delivery: params.delivery,
  };

  mockOrders.unshift(order);

  const chefOrder: ChefOrder = {
    id: orderId,
    dish: dishName,
    dishId,
    customer: 'A-801',
    society: params.consumerSociety,
    amount: total,
    status: 'Placed',
    urgent: false,
    createdAt: order.createdAt,
    allergyInfo: params.allergyInfo,
    delivery: params.delivery,
  };
  mockChefOrders.unshift(chefOrder);

  // Trigger push & in-app notifications
  sendNewOrderNotificationToChef(kitchenName, orderId, total);
  for (const soldOutName of soldOutDishNames) {
    sendSoldOutNotificationToChef(soldOutName);
  }

  // Publish pubsub updates so consumer, chef, and ops/CRM screens stay in sync
  pubsub.publish('chef-orders:kavita', chefOrder);
  pubsub.publish(`order:${orderId}`, order);
  pubsub.publish('ops-orders:all', order);

  return delay(order);
}

export async function getDishes(): Promise<Dish[]> {
  return delay(mockDishes);
}

export async function addCustomDish(dish: Dish): Promise<void> {
  mockDishes.push(dish);
  return delay(undefined);
}

export async function getChefDishes(): Promise<Record<string, ChefDish>> {
  return delay({ ...mockChefDishes });
}

export async function saveChefDishes(dishes: Record<string, ChefDish>): Promise<void> {
  mockChefDishes = { ...dishes };

  const user = useAuthStore.getState().user;
  const chefDisplayName = user?.displayName?.trim() || 'Chef';
  const chefProfileId = user?.chefProfileId || 'kavita';

  // Find or create chef's kitchen profile
  let targetIndex = mockKitchens.findIndex(k => k.id === chefProfileId || k.chefName?.toLowerCase() === chefDisplayName.toLowerCase() || k.name?.toLowerCase().includes(chefDisplayName.toLowerCase()));
  
  if (targetIndex === -1) {
    targetIndex = mockKitchens.findIndex(k => k.id === 'kavita');
  }

  if (targetIndex !== -1) {
    const targetKitchen = mockKitchens[targetIndex];
    const updatedDishes: KitchenDish[] = [];

    for (const dishId of Object.keys(dishes)) {
      const cd = dishes[dishId];
      if (cd.enabled) {
        const existingKd = targetKitchen.dishes.find(kd => kd.dishId === dishId);
        updatedDishes.push({
          dishId,
          name: cd.name,
          price: cd.price,
          discountPercent: cd.discountPercent || 0,
          leadTimeMinutes: cd.leadTimeMinutes,
          weeklyFree: cd.weeklyFree,
          sample: cd.sample,
          available: existingKd?.available ?? 'Daily',
          isEnabled: true
        });
      }
    }
    mockKitchens[targetIndex] = {
      ...targetKitchen,
      name: targetKitchen.name.includes('Master') || targetKitchen.name === "Kavita's Kitchen" ? `${chefDisplayName}'s Kitchen` : targetKitchen.name,
      chefName: chefDisplayName,
      dishes: updatedDishes
    };
  }

  pubsub.publish('dishes:all', dishes);
  pubsub.publish('dishes:live', dishes);
  return delay(undefined);
}

export async function getSupplies(): Promise<Supply[]> {
  return delay([...SUPPLIES]);
}

export async function sendMessage(
  threadId: string,
  text: string,
  from: 'consumer' | 'chef',
  mediaUrl?: string,
): Promise<Message> {
  const newMsg: Message = {
    from,
    text,
    timestamp: new Date().toISOString(),
    mediaUrl,
  };

  const key = mockChatMessagesStore[threadId] ? threadId : (mockChatMessagesStore[`thread_${threadId}`] ? `thread_${threadId}` : threadId);

  if (!mockChatMessagesStore[key]) {
    mockChatMessagesStore[key] = [];
  }
  mockChatMessagesStore[key].push(newMsg);

  // Update thread info
  const thread = mockChatThreads.find((t) => t.id === key || t.id === threadId || t.kitchenId === threadId);
  if (thread) {
    thread.lastMessage = text || 'Sent an attachment';
    thread.lastActivity = newMsg.timestamp;
  }

  pubsub.publish(`chat:${key}`, newMsg);

  if (from === 'consumer') {
    setTimeout(() => {
      pubsub.publish(`chat-typing:${key}`, { from: 'chef', isTyping: true });
    }, 300);
    setTimeout(() => {
      pubsub.publish(`chat-typing:${key}`, { from: 'chef', isTyping: false });
      const CHEF_REPLIES = [
        "Thanks for the message! I'll confirm availability shortly.",
        "Got it! I'll get back to you in a few minutes.",
        "Sure, let me check and update you!",
        "Noted! I'll make sure to accommodate your request.",
      ];
      const reply = CHEF_REPLIES[Math.floor(Math.random() * CHEF_REPLIES.length)];
      const chefMsg: Message = {
        from: 'chef',
        text: reply,
        timestamp: new Date().toISOString(),
      };
      mockChatMessagesStore[key]?.push(chefMsg);
      if (thread) {
        thread.lastMessage = chefMsg.text;
        thread.lastActivity = chefMsg.timestamp;
      }
      pubsub.publish(`chat:${key}`, chefMsg);
    }, 1400);
  }

  return delay(newMsg);
}

export function subscribeToChat(
  threadId: string,
  _currentUserId: string,
  onNewMessage: (msg: Message) => void,
  onTyping?: (fromRole: 'consumer' | 'chef', isTyping: boolean) => void,
  onRead?: (fromRole: 'consumer' | 'chef') => void
): () => void {
  const unsubMsg = pubsub.subscribe(`chat:${threadId}`, onNewMessage);
  const unsubTyping = onTyping
    ? pubsub.subscribe(`chat-typing:${threadId}`, (p: { from: 'consumer' | 'chef'; isTyping: boolean }) => onTyping(p.from, p.isTyping))
    : () => {};
  const unsubRead = onRead
    ? pubsub.subscribe(`chat-read:${threadId}`, (p: { from: 'consumer' | 'chef' }) => onRead(p.from))
    : () => {};
  return () => {
    unsubMsg();
    unsubTyping();
    unsubRead();
  };
}

export function sendTypingIndicator(threadId: string, from: 'consumer' | 'chef', isTyping: boolean): void {
  pubsub.publish(`chat-typing:${threadId}`, { from, isTyping });
}

export function markThreadRead(threadId: string, from: 'consumer' | 'chef'): void {
  pubsub.publish(`chat-read:${threadId}`, { from });
}

export function subscribeToOrder(
  orderId: string,
  onUpdate: (order: Order) => void
): () => void {
  return pubsub.subscribe(`order:${orderId}`, onUpdate);
}

export function subscribeToChefOrders(
  chefProfileId: string,
  onUpdate: () => void
): () => void {
  // Let's listen on chefProfileId or default general channel
  const unsub1 = pubsub.subscribe(`chef-orders:${chefProfileId}`, onUpdate);
  const unsub2 = pubsub.subscribe('chef-orders:kavita', onUpdate);
  const unsub3 = pubsub.subscribe('ops-orders:all', onUpdate);
  return () => {
    unsub1();
    unsub2();
    unsub3();
  };
}

export function subscribeToOpsOrders(
  onUpdate: (order?: any) => void
): () => void {
  const unsub1 = pubsub.subscribe('ops-orders:all', onUpdate);
  const unsub2 = pubsub.subscribe('chef-orders:kavita', onUpdate);
  return () => {
    unsub1();
    unsub2();
  };
}

let mockChatThreads: any[] = [];

let mockChatMessagesStore: Record<string, Message[]> = {};

export async function getChatThreads(_userId: string, _role: 'consumer' | 'chef'): Promise<any[]> {
  return delay([...mockChatThreads]);
}

export async function getChatMessages(threadId: string): Promise<Message[]> {
  const msgs = mockChatMessagesStore[threadId] || mockChatMessagesStore[`thread_${threadId}`] || [];
  return delay([...msgs]);
}

export async function getChefSettlement(): Promise<{
  gross: number;
  platformFee: number;
  gatewayFee: number;
  net: number;
}> {
  const activeOrders = mockChefOrders.filter((o) => o.status !== 'Cancelled');
  const gross = activeOrders.reduce((sum, o) => sum + o.amount, 0);
  const breakdown = calculateSettlementBreakdown(gross);
  return delay({
    gross: breakdown.grossSales,
    platformFee: breakdown.platformFee,
    gatewayFee: breakdown.gatewayFee,
    net: breakdown.netPayout,
  });
}

// In-memory table for weekly menus (matching supabase schema)
let mockWeeklyMenus: WeeklyMenu[] = [];

function getMondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export async function getWeeklyMenu(chefProfileId: string): Promise<WeeklyMenu[]> {
  const result = mockWeeklyMenus.filter(m => m.chefProfileId === chefProfileId);
  return delay(result);
}

export async function saveWeeklyMenuItem(item: Omit<WeeklyMenu, 'id' | 'createdAt'>): Promise<WeeklyMenu> {
  const newItem: WeeklyMenu = {
    ...item,
    id: `wm-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString()
  };
  mockWeeklyMenus.push(newItem);
  return delay(newItem);
}

export async function deleteWeeklyMenuItem(id: string): Promise<void> {
  mockWeeklyMenus = mockWeeklyMenus.filter(m => m.id !== id);
  return delay(undefined);
}

// ─── Weekly Dishes (Phase 3+) mock stubs ────────────────────────────────────
import type { WeeklyDish, DayKey } from '../../types';
import type { ConsumerDishItem } from '../../components/ConsumerDishCard';

let rawMockWeeklyDishes: any[] = [
  {
    id: 'wd-1',
    chefId: 'kavita',
    day: 'Mon',
    dishName: 'Matar Paneer',
    category: 'Veg',
    mealType: 'Dinner',
    price: 100,
    quantity: 15,
    remainingQuantity: 12,
    description: 'Fresh cottage cheese and green peas in a rich onion tomato gravy, spiced to perfection.',
    closeTime: '11:59 PM',
    servingTime: '7:30 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-2',
    chefId: 'kavita',
    day: 'Mon',
    dishName: 'Aloo Paratha',
    category: 'Veg',
    mealType: 'Breakfast',
    price: 60,
    quantity: 20,
    remainingQuantity: 8,
    description: 'Whole wheat flatbread stuffed with spiced mashed potatoes, served with butter.',
    closeTime: '11:59 PM',
    servingTime: '8:30 AM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-sachin-1',
    chefId: 'sachin-kitchen',
    day: 'Mon',
    dishName: 'Special Dal Makhani',
    category: 'Veg',
    mealType: 'Dinner',
    price: 120,
    quantity: 20,
    remainingQuantity: 18,
    description: 'Rich, creamy overnight slow-cooked dal makhani by Chef Sachin.',
    closeTime: '11:59 PM',
    servingTime: '8:00 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-sachin-2',
    chefId: 'sachin-kitchen',
    day: 'Tue',
    dishName: 'Paneer Butter Masala',
    category: 'Veg',
    mealType: 'Dinner',
    price: 140,
    quantity: 15,
    remainingQuantity: 12,
    description: 'Tender cottage cheese in rich tomato butter gravy by Sachin Kitchen.',
    closeTime: '11:59 PM',
    servingTime: '8:00 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-3',
    chefId: 'bakers',
    day: 'Mon',
    dishName: 'Chocolate Cake Slice',
    category: 'Veg',
    mealType: 'Snacks',
    price: 80,
    quantity: 10,
    remainingQuantity: 3,
    description: 'Decadent chocolate fudge cake, moist and rich. Perfect for dessert lovers.',
    closeTime: '11:59 PM',
    servingTime: '4:00 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-4',
    chefId: 'kavita',
    day: 'Tue',
    dishName: 'Palak Paneer',
    category: 'Veg',
    mealType: 'Dinner',
    price: 115,
    quantity: 12,
    remainingQuantity: 12,
    description: 'Creamy spinach curry with soft paneer cubes, served with a hint of garlic.',
    closeTime: '11:59 PM',
    servingTime: '7:30 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-5',
    chefId: 'swad',
    day: 'Tue',
    dishName: 'Idli Sambar',
    category: 'Veg',
    mealType: 'Breakfast',
    price: 70,
    quantity: 15,
    remainingQuantity: 15,
    description: 'Fluffy steamed rice cakes served with hot sambar and fresh coconut chutney.',
    closeTime: '11:59 PM',
    servingTime: '8:30 AM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-6',
    chefId: 'kavita',
    day: 'Wed',
    dishName: 'Rajma Chawal',
    category: 'Veg',
    mealType: 'Lunch',
    price: 90,
    quantity: 25,
    remainingQuantity: 22,
    description: 'Classic Punjabi style red kidney beans curry served with long grain basmati rice.',
    closeTime: '11:59 PM',
    servingTime: '1:30 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-7',
    chefId: 'biryani',
    day: 'Wed',
    dishName: 'Veg Biryani',
    category: 'Veg',
    mealType: 'Lunch',
    price: 140,
    quantity: 15,
    remainingQuantity: 0,
    description: 'Fragrant basmati rice layered with spiced vegetables and herbs, cooked on dum.',
    closeTime: '11:59 PM',
    servingTime: '1:30 PM',
    status: 'sold_out',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-8',
    chefId: 'swad',
    day: 'Thu',
    dishName: 'Idli Sambar',
    category: 'Veg',
    mealType: 'Breakfast',
    price: 70,
    quantity: 15,
    remainingQuantity: 11,
    description: 'Soft idlis with flavorful home style sambar and coconut dip.',
    closeTime: '11:59 PM',
    servingTime: '8:30 AM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-9',
    chefId: 'kavita',
    day: 'Fri',
    dishName: 'Matar Paneer',
    category: 'Veg',
    mealType: 'Dinner',
    price: 100,
    quantity: 15,
    remainingQuantity: 14,
    description: 'Delicious cottage cheese curry prepared fresh in home kitchen.',
    closeTime: '11:59 PM',
    servingTime: '7:30 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-10',
    chefId: 'swad',
    day: 'Sat',
    dishName: 'Aloo Paratha',
    category: 'Veg',
    mealType: 'Breakfast',
    price: 60,
    quantity: 15,
    remainingQuantity: 15,
    description: 'Butter loaded potato parathas with pickle on the side.',
    closeTime: '11:59 PM',
    servingTime: '8:30 AM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-11',
    chefId: 'biryani',
    day: 'Sun',
    dishName: 'Veg Biryani',
    category: 'Veg',
    mealType: 'Dinner',
    price: 140,
    quantity: 20,
    remainingQuantity: 19,
    description: 'Spicy royal veg biryani cooked by Nazia Khan, a hot favorite in the tower.',
    closeTime: '11:59 PM',
    servingTime: '7:30 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-12',
    chefId: 'swad',
    day: 'Mon',
    dishName: 'Chicken Curry',
    category: 'Non-Veg',
    mealType: 'Dinner',
    price: 150,
    quantity: 12,
    remainingQuantity: 10,
    description: 'Tender chicken pieces simmered in a homestyle spicy curry gravy.',
    closeTime: '11:59 PM',
    servingTime: '7:30 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wd-13',
    chefId: 'biryani',
    day: 'Tue',
    dishName: 'Chicken Biryani',
    category: 'Non-Veg',
    mealType: 'Dinner',
    price: 180,
    quantity: 15,
    remainingQuantity: 14,
    description: 'Aromatic basmati rice cooked with juicy marinated chicken pieces.',
    closeTime: '11:59 PM',
    servingTime: '7:30 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

let mockWeeklyDishes: WeeklyDish[] = rawMockWeeklyDishes.map((d) => ({
  ...d,
  maxServings: d.quantity,
  remainingServings: d.remainingQuantity,
  isActive: d.status === 'active',
}));

export async function loadWeeklyDishes(
  chefId: string,
  _weekStartDate?: string
): Promise<WeeklyDish[]> {
  return delay(mockWeeklyDishes.filter(d => d.chefId === chefId));
}

export async function saveWeeklyDish(
  chefId: string,
  dish: WeeklyDish,
  _weekStartDate?: string
): Promise<WeeklyDish> {
  const existing = mockWeeklyDishes.findIndex(d => d.id === dish.id);
  const updatedDish = { ...dish, chefId };
  if (existing >= 0) {
    mockWeeklyDishes[existing] = updatedDish;
  } else {
    mockWeeklyDishes.unshift(updatedDish);
  }

  // Synchronize to mockKitchens so Discover screen getListings() reflects newly published dish immediately
  const targetKitchen = mockKitchens.find(k => k.id === chefId || k.id === 'kavita' || k.id === 'sakshi-kitchen');
  if (targetKitchen) {
    const existingKd = targetKitchen.dishes.find(kd => kd.dishId === dish.id);
    if (!existingKd) {
      const dishIdToUse = dish.id || `dish_${Date.now()}`;
      targetKitchen.dishes.unshift({
        dishId: dishIdToUse,
        name: dish.dishName || 'Dish',
        price: dish.price || 150,
        leadTimeMinutes: 45,
        weeklyFree: false,
        sample: false,
        available: dish.day || 'Today',
        isEnabled: true,
        description: dish.description || 'Freshly cooked home meal.',
      });

      // Ensure mockDishes catalog contains the metadata
      const existingCatalog = mockDishes.find(d => d.id === dishIdToUse || d.name.toLowerCase() === dish.dishName.toLowerCase());
      if (!existingCatalog) {
        mockDishes.unshift({
          id: dishIdToUse,
          name: dish.dishName,
          category: dish.foodType === 'NonVeg' ? 'Non-Veg' : 'Main Course',
          foodType: dish.foodType === 'NonVeg' ? 'NonVeg' : 'Veg',
          suggestedPrice: dish.price || 150,
          leadTimeMinutes: 45,
          tags: ['Chef Special', 'Fresh'],
          description: dish.description || 'Freshly cooked homemade meal prepared with love.',
        });
      }
    }
  }

  // Publish pubsub updates for real-time subscribers
  pubsub.publish(`dishes:${chefId}`, updatedDish);
  pubsub.publish('dishes:all', updatedDish);

  return delay(updatedDish);
}

export function subscribeToLiveDishes(onChange: () => void): () => void {
  const unsub1 = pubsub.subscribe('dishes:all', () => onChange());
  const unsub2 = pubsub.subscribe('dishes:live', () => onChange());
  return () => {
    unsub1();
    unsub2();
  };
}

export async function deleteWeeklyDish(id: string): Promise<void> {
  mockWeeklyDishes = mockWeeklyDishes.filter(d => d.id !== id);
  return delay(undefined);
}

export async function updateDishStatus(
  id: string,
  status: WeeklyDish['status']
): Promise<void> {
  const idx = mockWeeklyDishes.findIndex(d => d.id === id);
  if (idx >= 0) mockWeeklyDishes[idx] = { ...mockWeeklyDishes[idx], status };
  return delay(undefined);
}

export async function updateRemainingQuantity(
  id: string,
  remaining: number
): Promise<void> {
  const idx = mockWeeklyDishes.findIndex(d => d.id === id);
  if (idx >= 0) mockWeeklyDishes[idx] = { ...mockWeeklyDishes[idx], remainingQuantity: remaining };
  return delay(undefined);
}

export async function reopenDish(id: string, originalQty: number): Promise<void> {
  const idx = mockWeeklyDishes.findIndex(d => d.id === id);
  if (idx >= 0) {
    mockWeeklyDishes[idx] = {
      ...mockWeeklyDishes[idx],
      status: 'active',
      remainingQuantity: originalQty,
    };
  }
  return delay(undefined);
}

export async function getWeeklyDishesForConsumer(
  consumerSocietyId: string,
  _weekStartDate?: string
): Promise<ConsumerDishItem[]> {
  const activeDishes = mockWeeklyDishes.filter(
    (wd) => wd.status === 'active' || wd.status === 'sold_out'
  );

  const results = activeDishes.map((wd) => {
    const kitchen = mockKitchens.find((k) => k.id === wd.chefId) || {
      name: 'Unknown Kitchen',
      chefName: 'Chef',
      society: 'Lotus Heights',
    };

    const isSameSociety = kitchen.society === consumerSocietyId;
    const isBookingOpen = wd.remainingQuantity > 0 && wd.status === 'active';

    return {
      id: wd.id,
      chefId: wd.chefId || '',
      chefName: (kitchen as any).chefName || (kitchen as any).chef_name || kitchen.name || 'Chef',
      kitchenName: kitchen.name,
      societyName: kitchen.society,
      isSameSociety,
      day: wd.day,
      dishName: wd.dishName,
      category: wd.category,
      mealType: wd.mealType,
      price: wd.price,
      remainingQuantity: wd.remainingQuantity,
      description: wd.description,
      closeTime: wd.closeTime,
      servingTime: wd.servingTime,
      status: wd.status,
      isBookingOpen,
    };
  });

  return delay(results);
}

export async function updateKitchenProfile(chefProfileId: string, updates: Partial<Kitchen> & { bio?: string; specialty?: string }) {
  const kitchen = mockKitchens.find(k => k.id === chefProfileId);
  if (!kitchen) throw new Error('Kitchen not found');

  Object.assign(kitchen, updates);
  return delay(kitchen);
}

export async function createMockKitchen(kitchen: Kitchen): Promise<Kitchen> {
  mockKitchens.push(kitchen);
  return delay(kitchen);
}

let mockReviews: any[] = [
  {
    id: 'r1',
    orderId: 'HC-0900',
    kitchenId: 'kavita',
    kitchenName: "Kavita's Kitchen",
    dishId: 'rajma-chawal',
    dishName: 'Rajma Chawal',
    rating: 5,
    comment: 'Felt like home! The dal was perfectly spiced and the rice was fluffy. Will order again.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'r2',
    orderId: 'HC-0850',
    kitchenId: 'kavita',
    kitchenName: "Kavita's Kitchen",
    dishId: 'matar-paneer',
    dishName: 'Matar Paneer',
    rating: 4,
    comment: 'Very tasty, generous portions. Delivery was a little delayed but worth the wait.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function getReviewsForKitchen(kitchenId: string) {
  return delay(mockReviews.filter((r) => r.kitchenId === kitchenId));
}

export async function addReview(review: any) {
  const newR = {
    ...review,
    id: 'r_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  mockReviews.unshift(newR);
  return delay(newR);
}

export async function deleteReview(reviewId: string) {
  mockReviews = mockReviews.filter((r) => r.id !== reviewId);
  return delay(undefined);
}

