import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../lib/apiClient';
import { getSocket, joinRoom, leaveRoom } from '../../lib/socket';
import type {
  AllergyInfo,
  ChefDish,
  ChefOrder,
  DeliveryDetails,
  Dish,
  DishAddon,
  Kitchen,
  KitchenDish,
  Message,
  Order,
  OrderStatus,
  Supply,
} from '../../types';

// Mappers from database rows to frontend types

function mapDbDish(d: any): Dish {
  return {
    id: d.id,
    name: d.name,
    category: d.category || 'Homestyle',
    foodType: d.diet_type === 'NONVEG' ? 'NonVeg' : 'Veg',
    suggestedPrice: Number(d.price),
    leadTimeMinutes: d.prep_time_minutes || 120,
    tags: d.tags || [],
    image: d.image_url || undefined,
  };
}

function mapDbKitchenDish(d: any): KitchenDish {
  return {
    dishId: d.id,
    name: d.name,
    price: Number(d.price),
    discountPercent: Number(d.discount_percent || 0),
    leadTimeMinutes: d.prep_time_minutes || 120,
    weeklyFree: d.tags?.includes('Weekly Free') || d.is_free || false,
    sample: d.tags?.includes('Free sample') || false,
    available: 'Daily',
    isEnabled: d.is_available,
  };
}

function parseMediaItem(item: any, index: number, defaultType: 'image' | 'video' = 'image') {
  if (typeof item === 'string') {
    return {
      id: `${defaultType}-${index}`,
      url: item,
      type: defaultType,
    };
  }
  return {
    id: item?.id || `${defaultType}-${index}`,
    url: typeof item?.url === 'string' ? item.url : '',
    type: item?.type || defaultType,
    caption: item?.caption,
    createdAt: item?.createdAt,
  };
}

type KitchenStats = { rating: number; review_count: number; orders_completed: number };

async function fetchKitchenStats(kitchenIds?: string[]): Promise<Record<string, KitchenStats>> {
  try {
    const qs = kitchenIds && kitchenIds.length > 0 ? `?ids=${kitchenIds.join(',')}` : '';
    const response = await apiClient.get(`/kitchens/stats${qs}`);
    return response?.data || {};
  } catch (err) {
    console.warn('fetchKitchenStats error:', err);
    return {};
  }
}

function mapDbKitchen(k: any, dishesList: any[], stats?: KitchenStats): Kitchen {
  let flat = '';
  let society = k.address || '';
  if (k.address && k.address.includes(',')) {
    const parts = k.address.split(',');
    flat = parts[0].trim();
    society = parts.slice(1).join(',').trim();
  }

  const storyPrompts = k.story_prompts || [];
  if (k.bio && !storyPrompts.some((p: any) => p.id === 'bio')) {
    storyPrompts.unshift({ id: 'bio', prompt: 'About Me', answer: k.bio });
  }

  const rawGallery = (Array.isArray(k.kitchen_info?.gallery) && k.kitchen_info.gallery.length > 0)
    ? k.kitchen_info.gallery
    : (Array.isArray(k.gallery) ? k.gallery : []);

  const rawVideos = (Array.isArray(k.kitchen_info?.videos) && k.kitchen_info.videos.length > 0)
    ? k.kitchen_info.videos
    : (Array.isArray(k.videos) ? k.videos : []);

  const rawCover = (k.kitchen_info?.coverImage !== undefined)
    ? k.kitchen_info.coverImage
    : (k.cover_image !== undefined ? k.cover_image : undefined);

  const rawProfile = (k.kitchen_info?.profileImage !== undefined)
    ? k.kitchen_info.profileImage
    : (k.profile_image !== undefined ? k.profile_image : undefined);

  return {
    id: k.id,
    name: k.name,
    chefName: k.profiles?.name || k.profiles?.display_name || k.kitchen_info?.chefName || (typeof k.chef_name === 'string' ? k.chef_name : 'Chef'),
    society: society,
    tower: '',
    flat: flat,
    distanceKm: 0.5,
    // Real rating/order-count from apps/backend (GET /kitchens/stats) when
    // the caller fetched it — a brand-new kitchen with no reviews/orders
    // yet honestly shows 0, rather than the old hardcoded 4.7-4.9.
    rating: stats?.rating ?? 0,
    orders: stats?.orders_completed ?? 0,
    anonymous: k.hide_identity || false,
    hygieneBadge: k.is_verified || false,
    // Was hardcoded true regardless of the real column, which defaults to
    // false for every new kitchen (see supabase/schema.sql) — so the chef
    // dashboard's "Accepting orders / Paused" toggle had nothing real to
    // reflect or affect either way. `is_live` may be undefined on rows
    // fetched before this column existed; treat that as live rather than
    // hiding pre-existing kitchens.
    isLive: k.is_live !== false,
    coverImage: typeof rawCover === 'string' ? rawCover : undefined,
    profileImage: typeof rawProfile === 'string' ? rawProfile : undefined,
    bio: k.bio || undefined,
    storyPrompts: storyPrompts,
    gallery: rawGallery.map((m: any, i: number) => parseMediaItem(m, i, 'image')),
    videos: rawVideos.map((m: any, i: number) => parseMediaItem(m, i, 'video')),
    hygieneDetails: k.hygiene_details || [],
    hygienePhotos: Array.isArray(k.kitchen_info?.hygienePhotos)
      ? k.kitchen_info.hygienePhotos.map((m: any, i: number) => parseMediaItem(m, i, 'image'))
      : [],
    hygieneVideos: Array.isArray(k.kitchen_info?.hygieneVideos)
      ? k.kitchen_info.hygieneVideos.map((m: any, i: number) => parseMediaItem(m, i, 'video'))
      : [],
    trustBadges: k.trust_badges || [],
    kitchenInfo: {
      cuisine: k.kitchen_info?.kitchenDetails?.cuisine || k.kitchen_info?.cuisine || k.specialty || '',
      experience: k.kitchen_info?.kitchenDetails?.experience || k.kitchen_info?.experience || '',
      prepTime: k.kitchen_info?.kitchenDetails?.prepTime || k.kitchen_info?.prepTime || '',
      deliveryTime: k.kitchen_info?.kitchenDetails?.deliveryTime || k.kitchen_info?.deliveryTime || '',
      operatingHours: k.kitchen_info?.kitchenDetails?.operatingHours || k.kitchen_info?.operatingHours || '',
      languages: k.kitchen_info?.kitchenDetails?.languages || k.kitchen_info?.languages || '',
      society: society,
      // Settlements/wallet/dashboard all read bank details back out of
      // kitchenInfo.kitchenDetails.bankDetails (where handleSaveBank actually
      // writes it) — this object never passed kitchenDetails through at all,
      // so a save that genuinely persisted on the backend still looked empty
      // on every read, indistinguishable from "not saving."
      kitchenDetails: k.kitchen_info?.kitchenDetails || undefined,
      bankDetails: k.kitchen_info?.bankDetails || undefined,
    },
    stats: k.stats || { ordersCompleted: stats?.orders_completed ?? 0, responseTime: '15 mins' },
    dishes: dishesList.map(mapDbKitchenDish),
  };
}

function mapDbOrder(o: any): Order {
  // o.items is the real backend shape (OrderService.getOrderById/
  // OrderRepository.getConsumerHistory); o.order_items was the old direct
  // Supabase nested-select shape — kept as a fallback since placeOrder's
  // own return value still goes through this same mapper with neither.
  const firstItem = o.items?.[0] || o.order_items?.[0] || {};
  let delivery: DeliveryDetails = {
    method: o.delivery_method === 'PICKUP' ? 'PICKUP' : 'DELIVERY_PARTNER',
    fee: Number(o.delivery_fee) || 0,
    deliveryAddress: {
      address: o.delivery_address || 'Lotus Heights, Tower A, Flat 801',
      estimatedDeliveryTime: 'Tonight',
    }
  };
  let allergyInfo: AllergyInfo = {
    tags: o.allergy_tags || [],
    otherText: o.allergy_other_text || '',
  };

  try {
    if (o.delivery_address && (o.delivery_address.startsWith('{') || o.delivery_address.startsWith('['))) {
      const parsed = JSON.parse(o.delivery_address);
      if (parsed.delivery) delivery = parsed.delivery;
      if (parsed.allergyInfo) allergyInfo = parsed.allergyInfo;
    }
  } catch {
    // ignore
  }

  let status: any = 'placed';
  if (o.status) {
    status = o.status.toLowerCase();
    if (status === 'completed') status = 'delivered';
  }

  return {
    id: o.id,
    orderCode: o.order_code || undefined,
    kitchenId: o.kitchen_id,
    dishId: firstItem.dish_id || 'matar-paneer',
    kitchenName: o.kitchen_name || o.kitchens?.name || "Chef Kitchen",
    dishName: firstItem.dish_name_snapshot || "Dish Item",
    quantity: firstItem.quantity || 1,
    listAmount: Number(o.list_price) || 0,
    societyDiscount: Number(o.discount) || 0,
    deliveryFee: Number(o.delivery_fee) || 0,
    total: Number(o.total_paid || o.total_amount) || 0,
    status,
    eta: o.is_party_order && o.party_booking_date ? o.party_booking_date : (delivery.method === 'PICKUP' ? (delivery.pickupLocation?.estimatedReadyTime || 'Tonight') : (delivery.deliveryAddress?.estimatedDeliveryTime || 'Tonight')),
    createdAt: o.created_at,
    allergyInfo,
    delivery,
    isPartyOrder: o.is_party_order || false,
    partyBookingDate: o.party_booking_date || undefined,
    guestCount: o.guest_count || o.quantity || undefined,
    selectedPackName: o.selected_pack_name || (o.is_party_order ? 'JALSA' : undefined),
    perHeadPrice: Number(o.per_head_price) || undefined,
    partyDishes: Array.isArray(o.party_dishes) ? o.party_dishes : [],
    paymentStatus: (o.payment_status || 'PENDING').toUpperCase() as any,
    addons: Array.isArray(firstItem.addons) ? firstItem.addons : [],
  };
}

function mapDbChefOrder(o: any): ChefOrder {
  const firstItem = o.order_items?.[0] || {};
  let delivery: DeliveryDetails = {
    method: o.delivery_method === 'PICKUP' ? 'PICKUP' : 'DELIVERY_PARTNER',
    fee: Number(o.delivery_fee) || 0,
    deliveryAddress: {
      address: o.delivery_address || 'Lotus Heights, Tower A, Flat 801',
      estimatedDeliveryTime: 'Tonight',
    }
  };
  let allergyInfo: AllergyInfo = {
    tags: o.allergy_tags || [],
    otherText: o.allergy_other_text || '',
  };

  try {
    if (o.delivery_address && (o.delivery_address.startsWith('{') || o.delivery_address.startsWith('['))) {
      const parsed = JSON.parse(o.delivery_address);
      if (parsed.delivery) delivery = parsed.delivery;
      if (parsed.allergyInfo) allergyInfo = parsed.allergyInfo;
    }
  } catch {
    // ignore
  }

  let customerName = o.profiles?.name || o.profiles?.display_name || 'Resident';
  let societyName = 'Lotus Heights';
  try {
    if (o.delivery_address && (o.delivery_address.startsWith('{') || o.delivery_address.startsWith('['))) {
      const parsed = JSON.parse(o.delivery_address);
      if (parsed.consumerName) {
        customerName = parsed.consumerName;
      }
    }
  } catch {
    // ignore
  }

  if (delivery.method === 'DELIVERY_PARTNER' && delivery.deliveryAddress?.address) {
    const addr = delivery.deliveryAddress.address;
    const societyPart = addr.split(',')[0]?.trim();
    if (societyPart) societyName = societyPart;
    if (addr.includes('Flat') && customerName === 'Resident') {
      const matches = addr.match(/Flat\s*(\S+)/i);
      if (matches && matches[1]) customerName = matches[1];
    }
  }

  if (customerName === 'Resident') {
    if (delivery.method === 'DELIVERY_PARTNER' && delivery.deliveryAddress?.address) {
      const addr = delivery.deliveryAddress.address;
      if (addr.includes('Lotus Heights')) societyName = 'Lotus Heights';
      if (addr.includes('Flat')) {
        const matches = addr.match(/Flat\s*(\S+)/i);
        if (matches && matches[1]) customerName = `Flat ${matches[1]}`;
      }
    } else if (delivery.method === 'PICKUP' && delivery.pickupLocation?.address) {
      const addr = delivery.pickupLocation.address;
      if (addr.includes('Flat')) {
        const matches = addr.match(/Flat\s*(\S+)/i);
        if (matches && matches[1]) customerName = `Flat ${matches[1]}`;
      }
    }
  }

  const totalAmount = Number(o.total_paid || o.grand_total || o.item_total || 0);
  const quantity = Number(firstItem.quantity || o.quantity || 1);
  const etaDay = delivery.deliveryAddress?.estimatedDeliveryTime || 'Mon';

  return {
    id: o.id,
    orderCode: o.order_code || undefined,
    dish: firstItem.dish_name_snapshot || "Dish Item",
    dishId: firstItem.dish_id || "dish-id",
    kitchenId: o.kitchen_id,
    kitchenName: o.kitchens?.name || 'My Kitchen',
    customer: customerName,
    customerName: customerName,
    customerId: o.customer_id,
    society: societyName,
    amount: totalAmount,
    total: totalAmount,
    quantity: quantity,
    eta: etaDay,
    status: o.status,
    urgent: false,
    createdAt: o.created_at,
    allergyInfo,
    delivery,
    addons: Array.isArray(firstItem.addons) ? firstItem.addons : [],
  };
}

export async function getActiveChefProfileId(): Promise<string> {
  const user = useAuthStore.getState().user;
  if (user?.chefProfileId && user.chefProfileId.length === 36) {
    return user.chefProfileId;
  }
  if (!user?.id) return user?.chefProfileId || user?.id || '';

  // Kitchen creation always goes through the backend now (chef-register.tsx,
  // see Phase 3.5) — this used to query/auto-create directly against
  // Supabase's own Postgres, which would have created a kitchen invisible to
  // every converted (Drizzle/local Postgres) endpoint. This is just a
  // fallback for when chefProfileId wasn't already in the auth store
  // (e.g. stale persisted session from before a kitchen existed).
  try {
    const response = await apiClient.get('/kitchens/me');
    if (response?.data?.id) {
      useAuthStore.getState().setUser({ ...user, chefProfileId: response.data.id } as any);
      return response.data.id;
    }
  } catch (e) {
    console.warn('getActiveChefProfileId lookup error:', e);
  }

  // Auto-create kitchen profile for chef — same self-service endpoint
  // chef-register.tsx uses, with the same force-owned-by-caller guarantee.
  try {
    const created = await apiClient.post('/kitchens', {
      chef_user_id: user.id,
      name: user.displayName ? `${user.displayName}'s Kitchen` : 'My Kitchen',
      chef_name: user.displayName || 'Chef',
      address: user.society || '',
      is_live: true,
    });
    if (created?.data?.id) {
      useAuthStore.getState().setUser({ ...user, chefProfileId: created.data.id } as any);
      return created.data.id;
    }
  } catch (e) {
    console.warn('getActiveChefProfileId auto-create error:', e);
  }

  return user.id;
}

export async function getListings(
  consumerSociety: string,
  query?: string,
  quickFilter?: string,
): Promise<{ kitchen: Kitchen; item: KitchenDish; dish: Dish }[]> {
  // GET /dishes/discover (DishRepository.getAvailableWithKitchens) shapes
  // its response exactly like this direct Supabase join used to, so
  // everything below (filtering, sorting) is unchanged.
  let data: any[];
  try {
    const response = await apiClient.get('/dishes/discover');
    data = response?.data || [];
  } catch (err) {
    console.warn('getListings error:', err);
    return [];
  }

  // Exclude dishes from a paused kitchen (kitchens.is_live === false). This
  // was never checked anywhere — the chef dashboard's "Paused" toggle had no
  // effect on what consumers could see or order, only on its own label.
  const liveData = data.filter((d: any) => d.kitchens?.is_live !== false);

  const statsMap = await fetchKitchenStats();

  const results = liveData.map((d: any) => {
    const k = d.kitchens;
    const mappedKitchen = mapDbKitchen(k, [d], statsMap[k.id]);
    const mappedItem = mapDbKitchenDish(d);
    const mappedDish = mapDbDish(d);
    return {
      kitchen: mappedKitchen,
      item: mappedItem,
      dish: mappedDish,
    };
  });

  const normalizedQuery = (query ?? '').trim().toLowerCase();
  return results
    .filter(({ kitchen, item, dish }) => {
      if (!dish) return false;
      const text = `${kitchen.name} ${kitchen.society} ${dish.name} ${dish.category}`.toLowerCase();
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
}

export async function getKitchen(id: string): Promise<Kitchen | null> {
  let queryId = id;
  const user = useAuthStore.getState().user;

  if (!queryId || queryId.length !== 36 || queryId === 'kavita') {
    if (user?.chefProfileId && user.chefProfileId.length === 36) {
      queryId = user.chefProfileId;
    }
  }

  // Attempt lookup by ID
  let kitchenData: any = null;
  try {
    const response = await apiClient.get(`/kitchens/${queryId}`);
    kitchenData = response?.data || null;
  } catch {
    // fall through to the "my own kitchen" lookup below
  }

  // If not found by ID, fall back to the caller's own kitchen (GET
  // /kitchens/me — covers a chef viewing their own profile before
  // chefProfileId is reliably set).
  if (!kitchenData && user?.id) {
    try {
      const response = await apiClient.get('/kitchens/me');
      if (response?.data) {
        kitchenData = response.data;
        queryId = response.data.id;
      }
    } catch {
      // no kitchen for this user either
    }
  }

  if (!kitchenData) return null;

  let dishesData: any[] = [];
  try {
    const response = await apiClient.get(`/dishes?kitchen_id=${queryId}`);
    dishesData = response?.data || [];
  } catch {
    // leave empty
  }

  const statsMap = await fetchKitchenStats([queryId]);
  return mapDbKitchen(kitchenData, dishesData, statsMap[queryId]);
}

export async function getDish(dishId: string): Promise<Dish | null> {
  try {
    const response = await apiClient.get(`/dishes/${dishId}`);
    if (response?.data) return mapDbDish(response.data);
  } catch {
    // fall through to weekly dish lookup
  }

  try {
    const response = await apiClient.get(`/weekly-dishes/${dishId}`);
    const weeklyData = response?.data;
    if (weeklyData) {
      return {
        id: weeklyData.id,
        name: weeklyData.dish_name,
        category: weeklyData.category === 'Non-Veg' ? 'Non-Veg' : 'Veg',
        description: weeklyData.description || '',
        price: Number(weeklyData.price),
      } as any;
    }
  } catch {
    // neither exists
  }

  return null;
}

export async function getOrders(userId: string): Promise<Order[]> {
  // userId kept in the signature for existing call sites, but the backend
  // always scopes history to the authenticated session (req.user.id) — a
  // client-supplied id was never trustworthy as a filter anyway.
  try {
    const response = await apiClient.get('/orders/history');
    return (response?.data || []).map(mapDbOrder);
  } catch (err) {
    console.warn('getOrders error:', err);
    return [];
  }
}

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response?.data ? mapDbOrder(response.data) : null;
  } catch {
    return null;
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  // Backend's real OrderStatus enum is uppercase and matches this directly
  // now (PLACED/ACCEPTED/PREPARING/READY/OUT_FOR_DELIVERY/DELIVERED/
  // CANCELLED/REJECTED) — the old client used to remap 'delivered' to
  // 'COMPLETED', a status that was never a real value in this schema at all.
  await apiClient.patch(`/orders/${orderId}/status`, { status: status.toUpperCase() });
}

/**
 * Adds extra guest packs to a party pre-booking.
 *
 * This used to compute the new total client-side (from the order's own
 * total/guest-count fields) and write it directly to Supabase — nothing on
 * the server ever verified or recomputed that price, so a client could send
 * any total it wanted. It's now a backend call: the server reads the order's
 * own persisted per_head_price and recomputes the addon price itself (see
 * apps/backend/src/controllers/party.controller.ts#addPartyPacks), which is
 * also why the direct Supabase write here would now be rejected outright by
 * the orders authorization lockdown's financial-column trigger even if we
 * kept it (see
 * supabase/migrations/20260920000001_lock_down_orders_authorization.sql).
 * `perHeadPrice`/`isAccepted` are no longer needed here — kept as unused
 * parameters only so existing call sites don't need to change their arity.
 */
export async function addMorePartyPacks(
  orderId: string,
  additionalCount: number,
  _perHeadPrice: number,
  _isAccepted: boolean = true
): Promise<{ additionalCount: number; ratePerPack: number; addonTotal: number; newTotal: number }> {
  const res = await apiClient.post(`/party/bookings/${orderId}/add-packs`, {
    additional_count: additionalCount,
  });
  if (!res?.success) {
    throw new Error(res?.message || 'Failed to add packs to this booking');
  }
  const { ratePerPack, addonTotal, newTotal } = res.data;
  return { additionalCount, ratePerPack, addonTotal, newTotal };
}

export async function cancelOrder(orderId: string): Promise<void> {
  // PATCH /orders/:id/status already handles CANCELLED fully server-side —
  // ownership check, the transition table, and an automatic refund if the
  // order was paid (apps/backend/src/services/order.service.ts
  // #updateOrderStatus). The old client-side version wrote CANCELLED
  // directly and separately tried a Supabase RPC (restore_dish_quantity) to
  // put a weekly dish's reserved servings back — that doesn't have a
  // backend equivalent yet (weekly-dish cancellation restock is a real,
  // known gap, not carried forward silently: see neon-migration-status
  // memory).
  await apiClient.patch(`/orders/${orderId}/status`, { status: 'CANCELLED' });
}

export async function getChefOrders(): Promise<ChefOrder[]> {
  const chefProfileId = await getActiveChefProfileId();
  if (!chefProfileId) return [];

  try {
    const response = await apiClient.get(`/orders/history?kitchen_id=${chefProfileId}`);
    const data = response?.data;
    if (!data || data.length === 0) return [];
    return data.map(mapDbChefOrder);
  } catch (e) {
    console.warn('getChefOrders error:', e);
    return [];
  }
}

export async function placeOrder(params: {
  kitchenId: string;
  // One or more dishes from this same kitchen, checked out as a single
  // order. Previously this only took one dishId/quantity pair, so a
  // multi-item cart checkout had to call this once per item — N separate
  // orders, each billed independently, instead of one combined order for
  // what the user experienced as a single checkout. Reported directly:
  // "checkout will be single order, why multiple orders."
  items: { dishId: string; quantity: number; addonIds?: string[] }[];
  consumerSociety: string;
  allergyInfo: AllergyInfo;
  delivery: DeliveryDetails;
}): Promise<Order> {
  let chefProfileId = params.kitchenId;
  if (chefProfileId.length !== 36) {
    chefProfileId = await getActiveChefProfileId();
  }

  // Server resolves each dish (catalog or weekly), validates kitchen/stock
  // status, and computes pricing itself — see
  // apps/backend/src/services/order.service.ts#createDirectOrder. Previously
  // this entire function ran client-side (pricing included) and wrote
  // straight into Supabase with the Postgres RLS policy as the only gate.
  const response = await apiClient.post('/orders/direct', {
    kitchen_id: chefProfileId,
    items: params.items.map((item) => ({
      dish_id: item.dishId,
      quantity: item.quantity,
      addon_ids: item.addonIds || [],
    })),
    consumer_society: params.consumerSociety,
    delivery_method: params.delivery.method,
    delivery_address: JSON.stringify({
      delivery: params.delivery,
      allergyInfo: params.allergyInfo,
      consumerName: useAuthStore.getState().user?.displayName || 'Resident',
      consumerPhone: useAuthStore.getState().user?.phone || '',
    }),
    allergy_tags: params.allergyInfo.tags,
    allergy_other_text: params.allergyInfo.otherText,
  });

  return mapDbOrder(response.data);
}

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function slugifyName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function getChefDishes(): Promise<Record<string, ChefDish>> {
  const chefProfileId = await getActiveChefProfileId();
  let data: any[] = [];
  try {
    const response = await apiClient.get(`/dishes?kitchen_id=${chefProfileId}`);
    data = response?.data || [];
  } catch (err) {
    console.warn('getChefDishes error:', err);
  }

  const record: Record<string, ChefDish> = {};
  if (data) {
    data.forEach((d: any) => {
      const item: ChefDish = {
        id: d.id,
        name: d.name,
        category: d.category ?? 'Homestyle',
        foodType: d.diet_type === 'NONVEG' ? 'NonVeg' : 'Veg',
        suggestedPrice: Number(d.price),
        leadTimeMinutes: d.prep_time_minutes || 120,
        tags: d.tags ?? [],
        image: d.image_url,
        enabled: Boolean(d.is_available),
        price: Number(d.price),
        discountPercent: Number(d.discount_percent || 0),
        weeklyFree: d.tags?.includes('Weekly Free') || false,
        sample: d.tags?.includes('Free sample') || Boolean(d.is_free) || false,
      };
      record[d.id] = item;
      if (d.name) {
        const slug = slugifyName(d.name);
        record[slug] = item;
      }
    });
  }
  return record;
}

import { notifyLiveDishListeners } from './weeklyDishes';

export async function saveChefDishes(dishes: Record<string, ChefDish>): Promise<void> {
  const chefProfileId = await getActiveChefProfileId();

  // Filter duplicate entries (since chefDishes stores both dish.id and dish slug)
  const uniqueDishesMap = new Map<string, ChefDish>();
  for (const [key, cd] of Object.entries(dishes)) {
    const keyId = cd.id || cd.name || key;
    if (!uniqueDishesMap.has(keyId)) {
      uniqueDishesMap.set(keyId, cd);
    }
  }

  // Fetched once up front so "find by name" below doesn't issue one API call
  // per dish being saved.
  let existingDishesByName = new Map<string, string>();
  try {
    const response = await apiClient.get(`/dishes?kitchen_id=${chefProfileId}`);
    for (const row of (response?.data || [])) {
      existingDishesByName.set(String(row.name).toLowerCase(), row.id);
    }
  } catch (err) {
    console.warn('saveChefDishes: failed to fetch existing dishes:', err);
  }

  const promises = Array.from(uniqueDishesMap.entries()).map(async ([dishId, cd]) => {
    const dishName = cd.name || (typeof dishId === 'string' && !isUuid(dishId) ? dishId : null);
    if (!dishName) return;

    // Rebuilt fresh from the current boolean flags every save — previously
    // this started from the stale cd.tags array and only ever pushed a tag
    // when its flag was true, so turning a flag OFF never removed the tag:
    // the next fetch read it back from tags and the UI snapped the pill
    // back to "selected".
    const tags: string[] = (cd.tags || []).filter(
      (t) => t !== 'Weekly Free' && t !== 'Free sample'
    );
    if (cd.weeklyFree) tags.push('Weekly Free');
    if (cd.sample) tags.push('Free sample');

    const payload: any = {
      kitchen_id: chefProfileId,
      name: dishName,
      category: cd.category || (cd.foodType === 'NonVeg' ? 'Non-Veg' : 'Veg'),
      diet_type: cd.foodType === 'NonVeg' ? 'NONVEG' : 'VEG',
      price: cd.price || cd.suggestedPrice || 100,
      prep_time_minutes: cd.leadTimeMinutes || 60,
      is_available: Boolean(cd.enabled),
      // A chef's uploaded/selected dish photo was never written here at all —
      // only a remote (already-uploaded or stock) URL is accepted; a local
      // device file:// path would be meaningless to any other client anyway.
      // cd.image is also sometimes a bundled local asset reference (an
      // object/number, not a string) — menu.tsx auto-fills it from
      // getRandomDishImage() when the typed dish name matches a known
      // catalog entry — so this crashed outright (cd.image.startsWith is
      // not a function) for literally the most common case: typing a
      // recognized dish name and saving.
      ...(typeof cd.image === 'string' && cd.image.startsWith('http') ? { image_url: cd.image } : {}),
      tags,
      is_free: Boolean(cd.weeklyFree || cd.sample),
    };

    // If we have a valid UUID id, update that specific row. kitchen_id is
    // dropped on update — PUT /dishes/:id doesn't accept it (a dish can't
    // change kitchens) and the endpoint is ownership-checked server-side.
    try {
      if (isUuid(dishId)) {
        const { kitchen_id, ...updatePayload } = payload;
        await apiClient.put(`/dishes/${dishId}`, updatePayload);
        console.log('[WRITE PATH SUCCESS] saveChefDishes updated UUID dish:', dishId);
      } else {
        // Otherwise find by name (already fetched above) and update, or
        // create if not found.
        const existingId = existingDishesByName.get(dishName.toLowerCase());
        if (existingId) {
          const { kitchen_id, ...updatePayload } = payload;
          await apiClient.put(`/dishes/${existingId}`, updatePayload);
          console.log('[WRITE PATH SUCCESS] saveChefDishes updated existing dish:', existingId);
        } else {
          await apiClient.post('/dishes', payload);
          console.log('[WRITE PATH SUCCESS] saveChefDishes created new dish:', dishName);
        }
      }
    } catch (err) {
      console.error('[WRITE PATH ERROR] saveChefDishes failed:', err);
    }

    // Also populate weekly_dishes for every day of the week.
    try {
      const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const d = new Date();
      const dayNum = d.getDay();
      const diff = dayNum === 0 ? -6 : 1 - dayNum;
      d.setDate(d.getDate() + diff);
      const weekStart = d.toISOString().split('T')[0];

      // Fetched once for the whole week rather than once per day (was up to
      // 14 Supabase calls per dish being saved).
      const weekResponse = await apiClient.get(`/weekly-dishes?kitchen_id=${chefProfileId}&week_start_date=${weekStart}`);
      const weekRows: any[] = weekResponse?.data || [];

      for (const day of DAYS) {
        const entry = {
          kitchen_id: chefProfileId,
          day,
          dish_name: dishName,
          category: cd.foodType === 'NonVeg' ? 'Non-Veg' : 'Veg',
          meal_type: 'Lunch',
          price: cd.price || cd.suggestedPrice || 100,
          quantity: 15,
          remaining_quantity: 15,
          description: cd.description || 'Fresh homemade preparation',
          status: cd.enabled ? 'active' : 'paused',
          week_start_date: weekStart,
        };

        const existing = weekRows.find(
          (row) => row.day === day && String(row.dish_name).toLowerCase() === dishName.toLowerCase()
        );

        if (existing) {
          await apiClient.put(`/weekly-dishes/${existing.id}`, entry);
        } else {
          await apiClient.post('/weekly-dishes', entry);
        }
      }
      console.log('[WRITE PATH SUCCESS] saveChefDishes synced weekly_dishes entries for 7 days');
    } catch (e: any) {
      console.warn('[WRITE PATH WARNING] saveChefDishes weekly_dishes sync notice:', e.message);
    }

  });

  await Promise.all(promises);
  notifyLiveDishListeners();
}

export async function deleteChefDish(dish: { id: string; name: string }): Promise<void> {
  // Previously menu.tsx's handleDeleteDish only removed the dish from local
  // state — nothing ever called a DELETE here, so the dish's row (and its 7
  // weekly_dishes rows, one per day, written by saveChefDishes above) stayed
  // live forever. The dish reappeared after reopening the app (getChefDishes
  // still fetched it) and could even get silently re-PUT to the server on
  // the next unrelated save, since only one of its two local-state keys
  // (id/slug) was ever cleared.
  const chefProfileId = await getActiveChefProfileId();

  let realId: string | null = isUuid(dish.id) ? dish.id : null;
  if (!realId) {
    const response = await apiClient.get(`/dishes?kitchen_id=${chefProfileId}`);
    const match = (response?.data || []).find(
      (row: any) => String(row.name).toLowerCase() === dish.name.toLowerCase()
    );
    realId = match?.id || null;
  }
  if (realId) {
    await apiClient.delete(`/dishes/${realId}`);
  }

  try {
    // week_start_date is required by this endpoint — same Monday-of-this-week
    // computation saveChefDishes uses when it writes these rows.
    const d = new Date();
    const dayNum = d.getDay();
    const diff = dayNum === 0 ? -6 : 1 - dayNum;
    d.setDate(d.getDate() + diff);
    const weekStart = d.toISOString().split('T')[0];

    const weekResponse = await apiClient.get(`/weekly-dishes?kitchen_id=${chefProfileId}&week_start_date=${weekStart}`);
    const matches: any[] = (weekResponse?.data || []).filter(
      (row: any) => String(row.dish_name).toLowerCase() === dish.name.toLowerCase()
    );
    await Promise.all(matches.map((row) => apiClient.delete(`/weekly-dishes/${row.id}`)));
  } catch (e: any) {
    console.warn('[WRITE PATH WARNING] deleteChefDish weekly_dishes cleanup notice:', e.message);
  }

  notifyLiveDishListeners();
}

function mapDbAddon(a: any): DishAddon {
  return { id: a.id, dishId: a.dish_id, name: a.name, price: Number(a.price) };
}

export async function getDishAddons(dishId: string): Promise<DishAddon[]> {
  const response = await apiClient.get(`/dishes/${dishId}/addons`);
  return (response?.data || []).map(mapDbAddon);
}

export async function createDishAddon(dishId: string, addon: { name: string; price: number }): Promise<DishAddon> {
  const response = await apiClient.post(`/dishes/${dishId}/addons`, addon);
  return mapDbAddon(response.data);
}

export async function updateDishAddon(dishId: string, addonId: string, addon: { name?: string; price?: number }): Promise<DishAddon> {
  const response = await apiClient.put(`/dishes/${dishId}/addons/${addonId}`, addon);
  return mapDbAddon(response.data);
}

export async function deleteDishAddon(dishId: string, addonId: string): Promise<void> {
  await apiClient.delete(`/dishes/${dishId}/addons/${addonId}`);
}

export async function getSupplies(): Promise<Supply[]> {
  try {
    const response = await apiClient.get('/supplies');
    const data = response?.data || [];
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      unit: item.unit || 'kg',
      price: Number(item.price) || 0,
      iconText: item.name.substring(0, 2),
    }));
  } catch (err) {
    console.warn('getSupplies error:', err);
    return [];
  }
}

export async function placeSupplyOrder(items: { supply_item_id: string; quantity: number }[]): Promise<void> {
  await apiClient.post('/supplies/orders', { items });
}

export async function getOrCreateChatThread(consumerId: string, kitchenId: string): Promise<any> {
  const response = await apiClient.post('/chat/threads', { kitchen_id: kitchenId });
  const thread = response.data;
  return {
    id: thread.id,
    kitchenId: thread.kitchen_id,
    consumerId: thread.consumer_id,
    kitchenName: thread.kitchen_name || 'Chef Kitchen',
  };
}

export async function sendMessage(
  threadId: string,
  text: string,
  from: 'consumer' | 'chef',
  mediaUrl?: string,
): Promise<Message> {
  let queryThreadId = threadId;
  // A caller occasionally passes a synthetic "thread_<kitchenId>" id instead
  // of a real thread UUID (seen from older/mock-sourced state) — resolve it
  // the same way the real thread list already does, via the kitchen.
  if (threadId.startsWith('thread_') || threadId.length !== 36) {
    const kitchenId = threadId.replace('thread_', '');
    if (kitchenId.length === 36) {
      try {
        const thread = await getOrCreateChatThread('', kitchenId);
        queryThreadId = thread.id;
      } catch (e) {
        console.warn('Failed to resolve chat thread:', e);
      }
    }
    if (queryThreadId.length !== 36) {
      return { from, text, timestamp: new Date().toISOString(), mediaUrl };
    }
  }

  try {
    await apiClient.post(`/chat/threads/${queryThreadId}/messages`, { message: text, media_url: mediaUrl });
  } catch (err) {
    console.warn('sendMessage error:', err);
  }

  return {
    from,
    text,
    timestamp: new Date().toISOString(),
    mediaUrl,
  };
}

export async function getChatThreads(userId: string, role: 'consumer' | 'chef'): Promise<any[]> {
  // GET /chat/threads is role-aware server-side (ChatService.getThreadsForUser)
  // — the chef and consumer branches below just reshape its response the
  // same two different ways this function always has: the dedicated chef
  // chat screen expects `kitchenName` to actually be the customer's display
  // name (it's using this field as the thread label from the chef's point
  // of view) and matches threads by `consumerId`.
  let threads: any[];
  try {
    const response = await apiClient.get('/chat/threads');
    threads = response?.data || [];
  } catch (err) {
    console.warn('getChatThreads error:', err);
    return [];
  }

  if (role === 'chef') {
    return threads.map((t: any) => ({
      id: t.id,
      kitchenId: t.kitchen_id,
      consumerId: t.consumer_id,
      kitchenName: t.consumer_name || 'Customer',
      consumerName: t.consumer_name || 'Customer',
    }));
  }

  return threads.map((t: any) => ({
    id: t.id,
    kitchenId: t.kitchen_id,
    consumerId: t.consumer_id,
    kitchenName: t.kitchen_name || 'Chef Kitchen',
    consumerName: 'Resident',
  }));
}

export async function getChatMessages(threadId: string): Promise<Message[]> {
  let queryThreadId = threadId;
  if (threadId.startsWith('thread_') || threadId.length !== 36) {
    const kitchenId = threadId.replace('thread_', '');
    if (kitchenId.length === 36) {
      try {
        const thread = await getOrCreateChatThread('', kitchenId);
        queryThreadId = thread.id;
      } catch (e) {
        // ignore
      }
    }
    if (queryThreadId.length !== 36) return [];
  }

  const currentUserId = useAuthStore.getState().user?.id;

  try {
    const response = await apiClient.get(`/chat/threads/${queryThreadId}/messages`);
    const data = response?.data || [];
    return data.map((m: any) => ({
      from: m.sender_id === currentUserId ? (useAuthStore.getState().user?.activeRole === 'chef' ? 'chef' : 'consumer') : (useAuthStore.getState().user?.activeRole === 'chef' ? 'consumer' : 'chef'),
      text: m.body,
      timestamp: m.created_at,
      mediaUrl: m.media_url ?? undefined,
      isRead: m.is_read ?? undefined,
    }));
  } catch (err) {
    console.warn('getChatMessages error:', err);
    return [];
  }
}

export async function getChefSettlement(): Promise<{
  gross: number;
  platformFee: number;
  gatewayFee: number;
  net: number;
}> {
  // GET /finance/settlements (apps/backend/src/controllers/finance.controller.ts#getMySettlements)
  // is the same real, already-working endpoint settlements.tsx uses for its
  // history list — ordered by period_end desc, so the first row is current.
  try {
    const response = await apiClient.get('/finance/settlements');
    const list = response?.data || [];
    const latest = list[0];
    if (latest) {
      return {
        gross: Number(latest.total_sales) || 0,
        platformFee: Number(latest.platform_commission) || 0,
        gatewayFee: Number(latest.gateway_fees) || 0,
        net: Number(latest.net_payable) || 0,
      };
    }
  } catch (err) {
    console.warn('getChefSettlement error:', err);
  }

  return { gross: 0, platformFee: 0, gatewayFee: 0, net: 0 };
}

export async function updateKitchenProfile(chefProfileId: string, updates: Partial<Kitchen> & { bio?: string; specialty?: string }) {
  let queryId = chefProfileId;
  if (!chefProfileId || chefProfileId.length !== 36) {
    queryId = await getActiveChefProfileId();
  }

  // PUT /kitchens/:id (ownership-checked) is backed by Drizzle/local
  // Postgres now, not Supabase, and bio/specialty/gallery/videos/kitchen_info
  // are all confirmed-real columns — the old hasCol() guards defended against
  // Supabase/schema drift that no longer applies here. A failed lookup used
  // to fabricate and return a fake "success" kitchen object instead of
  // surfacing the error; it now throws like every other converted endpoint.
  const currentResponse = await apiClient.get(`/kitchens/${queryId}`);
  const currentKitchenRow = currentResponse?.data;
  if (!currentKitchenRow) {
    throw new Error('Kitchen profile not found.');
  }
  queryId = currentKitchenRow.id;

  const dbPayload: any = {};
  if (updates.name !== undefined) dbPayload.name = updates.name;
  if (updates.address !== undefined) {
    dbPayload.address = updates.address;
  } else if (updates.society !== undefined) {
    dbPayload.address = updates.society;
  }
  if (updates.bio !== undefined) dbPayload.bio = updates.bio;
  if (updates.storyPrompts !== undefined) dbPayload.story_prompts = updates.storyPrompts;
  if (updates.hygieneDetails !== undefined) dbPayload.hygiene_details = updates.hygieneDetails;
  if (updates.anonymous !== undefined) dbPayload.hide_identity = updates.anonymous;
  if ((updates as any).isLive !== undefined) dbPayload.is_live = (updates as any).isLive;
  if ((updates as any).bankStatus !== undefined) dbPayload.bank_status = (updates as any).bankStatus;
  // bank_details has no backing column on `kitchens` — never sent, same as before.

  if (updates.kitchenInfo?.cuisine !== undefined) {
    dbPayload.specialty = updates.kitchenInfo.cuisine;
  } else if (updates.specialty !== undefined) {
    dbPayload.specialty = updates.specialty;
  }

  const kitchenInfo = currentKitchenRow.kitchen_info ? { ...currentKitchenRow.kitchen_info } : {};
  let updateKitchenInfo = false;

  if (updates.kitchenInfo !== undefined) {
    kitchenInfo.kitchenDetails = {
      ...(kitchenInfo.kitchenDetails || {}),
      ...updates.kitchenInfo,
    };
    if (updates.kitchenInfo.cuisine) {
      kitchenInfo.cuisine = updates.kitchenInfo.cuisine;
    }
    updateKitchenInfo = true;
  }

  if (updates.profileImage !== undefined) {
    kitchenInfo.profileImage = updates.profileImage;
    dbPayload.profile_image = updates.profileImage;
    updateKitchenInfo = true;
  }

  if (updates.coverImage !== undefined) {
    kitchenInfo.coverImage = updates.coverImage;
    dbPayload.cover_image = updates.coverImage;
    updateKitchenInfo = true;
  }

  if (updates.gallery !== undefined) {
    kitchenInfo.gallery = updates.gallery;
    dbPayload.gallery = updates.gallery.map((g: any) => typeof g === 'string' ? g : g.url);
    updateKitchenInfo = true;
  }

  if (updates.videos !== undefined) {
    kitchenInfo.videos = updates.videos;
    dbPayload.videos = updates.videos.map((v: any) => typeof v === 'string' ? v : v.url);
    updateKitchenInfo = true;
  }

  if (updates.hygienePhotos !== undefined) {
    kitchenInfo.hygienePhotos = updates.hygienePhotos;
    updateKitchenInfo = true;
  }

  if (updates.hygieneVideos !== undefined) {
    kitchenInfo.hygieneVideos = updates.hygieneVideos;
    updateKitchenInfo = true;
  }

  if (updateKitchenInfo) {
    dbPayload.kitchen_info = kitchenInfo;
  }

  const dishesResponse = await apiClient.get(`/dishes?kitchen_id=${queryId}`);
  const dishesData = dishesResponse?.data || [];

  const statsMap = await fetchKitchenStats([queryId]);

  // If dbPayload has no columns to update, return current mapped state cleanly
  if (Object.keys(dbPayload).length === 0) {
    return mapDbKitchen(currentKitchenRow, dishesData, statsMap[queryId]);
  }

  const updatedResponse = await apiClient.put(`/kitchens/${queryId}`, dbPayload);
  const finalRow = updatedResponse?.data || currentKitchenRow;
  return mapDbKitchen(finalRow, dishesData, statsMap[queryId]);
}
// Presence (typing/read) channels are shared per-thread rather than
// recreated per call — broadcast .send() needs an already-subscribed
// channel, and repeatedly creating+subscribing a fresh unsubscribed
// channel per keystroke would both fail to deliver and leak connections.
/**
 * Real-time chat via the backend's Socket.io server (see
 * apps/backend/src/realtime/socketServer.ts), replacing Supabase's
 * postgres_changes/broadcast channels. Those watched Supabase's own
 * Postgres directly — once chat_messages started being written via Drizzle
 * against local Postgres instead (Phase 1), postgres_changes would never
 * have fired for a message sent through the real, converted endpoint again.
 */
export function subscribeToChat(
  threadId: string,
  currentUserId: string,
  onNewMessage: (msg: Message) => void,
  onTyping?: (fromRole: 'consumer' | 'chef', isTyping: boolean) => void,
  onRead?: (fromRole: 'consumer' | 'chef') => void
): () => void {
  if (!threadId) return () => { };

  const room = `chat:${threadId}`;
  const authState = useAuthStore.getState();
  const currentRole = authState.user?.activeRole || 'consumer';
  const otherRole: 'consumer' | 'chef' = currentRole === 'chef' ? 'consumer' : 'chef';

  const onMessage = (m: any) => {
    const from: 'consumer' | 'chef' = m.sender_id === currentUserId
      ? (currentRole === 'chef' ? 'chef' : 'consumer')
      : otherRole;
    onNewMessage({
      from,
      text: m.body,
      timestamp: m.created_at,
      mediaUrl: m.media_url ?? undefined,
    });
  };
  const onTypingEvent = (p: { sender_id: string; is_typing: boolean }) => {
    if (p.sender_id !== currentUserId) onTyping?.(otherRole, p.is_typing);
  };
  const onReadEvent = (p: { read_by: string }) => {
    if (p.read_by !== currentUserId) onRead?.(otherRole);
  };

  const socket = getSocket();
  joinRoom(room);
  socket.on('NEW_MESSAGE', onMessage);
  if (onTyping) socket.on('TYPING_INDICATOR', onTypingEvent);
  if (onRead) socket.on('MESSAGES_READ', onReadEvent);

  return () => {
    socket.off('NEW_MESSAGE', onMessage);
    socket.off('TYPING_INDICATOR', onTypingEvent);
    socket.off('MESSAGES_READ', onReadEvent);
    leaveRoom(room);
  };
}

/**
 * Typing/read status previously broadcast directly from one client to
 * another over a Supabase channel, with no server involved at all. Sockets
 * can't do peer-to-peer broadcast without the server relaying it, so this
 * now goes through the backend's existing REST endpoints
 * (ChatService.sendTypingIndicator/markMessagesAsRead), which already
 * re-broadcast over Socket.io to everyone else in the room.
 */
export function sendTypingIndicator(threadId: string, _from: 'consumer' | 'chef', isTyping: boolean): void {
  if (!threadId) return;
  apiClient.post(`/chat/messages/${threadId}/typing`, { is_typing: isTyping }).catch(() => {});
}

export function markThreadRead(threadId: string, _from: 'consumer' | 'chef'): void {
  if (!threadId) return;
  apiClient.put(`/chat/messages/${threadId}/read`).catch(() => {});
}

export function subscribeToOrder(
  orderId: string,
  onUpdate: (order: Order) => void
): () => void {
  if (!orderId) return () => { };

  const room = `order:${orderId}`;
  const socket = getSocket();
  const onStatusUpdated = async () => {
    const updated = await getOrder(orderId);
    if (updated) onUpdate(updated);
  };

  joinRoom(room);
  socket.on('ORDER_STATUS_UPDATED', onStatusUpdated);

  return () => {
    socket.off('ORDER_STATUS_UPDATED', onStatusUpdated);
    leaveRoom(room);
  };
}

export function subscribeToChefOrders(
  chefProfileId: string,
  onUpdate: () => void
): () => void {
  if (!chefProfileId) return () => { };

  const room = `chef-orders:${chefProfileId}`;
  const socket = getSocket();
  const handler = () => onUpdate();

  joinRoom(room);
  socket.on('NEW_ORDER', handler);
  socket.on('ORDER_UPDATED', handler);

  return () => {
    socket.off('NEW_ORDER', handler);
    socket.off('ORDER_UPDATED', handler);
    leaveRoom(room);
  };
}

export function subscribeToOpsOrders(onUpdate: () => void): () => void {
  const room = 'ops-orders:all';
  const socket = getSocket();
  const handler = () => onUpdate();

  joinRoom(room);
  socket.on('NEW_ORDER', handler);
  socket.on('ORDER_UPDATED', handler);

  return () => {
    socket.off('NEW_ORDER', handler);
    socket.off('ORDER_UPDATED', handler);
    leaveRoom(room);
  };
}

export async function getReviewsForKitchen(kitchenId: string) {
  try {
    const response = await apiClient.get(`/reviews/kitchen/${kitchenId}`);
    const data = response?.data || [];
    return data.map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      kitchenId: r.kitchen_id,
      kitchenName: r.kitchen_name || '',
      dishId: r.dish_id || '',
      dishName: r.dish_name || '',
      rating: Number(r.rating),
      comment: r.comment || '',
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.warn('getReviewsForKitchen error:', err);
    return [];
  }
}

export async function addReview(review: {
  orderId: string;
  kitchenId: string;
  kitchenName: string;
  dishId: string;
  dishName: string;
  rating: number;
  comment: string;
}) {
  // consumer_id is always taken from the authenticated session server-side
  // now (apps/backend/src/controllers/review.controller.ts#createReview),
  // which also verifies the reviewer actually placed the order being
  // reviewed — the old direct Supabase insert set neither.
  const response = await apiClient.post('/reviews', {
    order_id: review.orderId,
    kitchen_id: review.kitchenId,
    kitchen_name: review.kitchenName,
    dish_id: review.dishId,
    dish_name: review.dishName,
    rating: review.rating,
    comment: review.comment,
  });
  const data = response.data;
  return {
    id: data.id,
    orderId: data.order_id,
    kitchenId: data.kitchen_id,
    kitchenName: data.kitchen_name,
    dishId: data.dish_id,
    dishName: data.dish_name,
    rating: Number(data.rating),
    comment: data.comment,
    createdAt: data.created_at,
  };
}

export async function deleteReview(reviewId: string) {
  await apiClient.delete(`/reviews/${reviewId}`);
}



