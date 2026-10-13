import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import type { WeeklyDish, DayKey } from '../../types';
import type { ConsumerDishItem } from '../../components/ConsumerDishCard';

async function fetchKitchenRatings(kitchenIds: string[]): Promise<Record<string, number>> {
  if (kitchenIds.length === 0) return {};
  try {
    const response = await apiClient.get(`/kitchens/stats?ids=${kitchenIds.join(',')}`);
    const statsMap = response?.data || {};
    const ratings: Record<string, number> = {};
    for (const id of kitchenIds) ratings[id] = statsMap[id]?.rating ?? 0;
    return ratings;
  } catch (err) {
    console.warn('fetchKitchenRatings error:', err);
    return {};
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getWeekStart(offsetWeeks = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offsetWeeks * 7);
  return d.toISOString().split('T')[0];
}

function rowToWeeklyDish(row: Record<string, unknown>): WeeklyDish {
  const quantity = Number(row.quantity ?? row.max_servings ?? 10);
  const remaining = Number(row.remaining_quantity ?? row.remaining_servings ?? quantity);
  const isAct = row.status === 'active' || row.is_active === true || row.status === undefined;
  const cat = (row.category as string) || '';
  const isNonVeg = cat.toLowerCase().includes('non') || row.food_type === 'NonVeg';

  return {
    id: row.id as string,
    chefId: (row.kitchen_id as string) || '',
    kitchenId: (row.kitchen_id as string) || '',
    // Not backed by a real join — callers on the chef side (loadWeeklyDishes/
    // saveWeeklyDish) already know their own kitchen's identity and don't
    // read these fields. Consumer-side lookups use getWeeklyDishesForConsumer
    // below instead, which does join the real kitchen/society.
    kitchenName: 'My Kitchen',
    society: 'Lotus Heights',
    dishName: (row.dish_name as string) || (row.name as string) || 'Dish',
    category: isNonVeg ? 'Non-Veg' : 'Veg',
    foodType: isNonVeg ? 'NonVeg' : 'Veg',
    mealType: (row.meal_type as string) || 'Lunch',
    price: Number(row.price || 0),
    quantity: quantity,
    maxServings: quantity,
    remainingQuantity: remaining,
    remainingServings: remaining,
    prepTimeMinutes: Number(row.prep_time_minutes || 120),
    closeTime: (row.close_time as string) || '06:00 PM',
    status: (row.status as any) || 'active',
    day: (row.day as DayKey) || 'Mon',
    createdAt: (row.created_at as string) || new Date().toISOString(),
    publishedAt: (row.created_at as string) || new Date().toISOString(),
    isActive: isAct,
  };
}

function computeIsBookingOpen(closeTime: string | null | undefined): boolean {
  // If no close time specified, always open
  if (!closeTime || closeTime.trim() === '') return true;
  try {
    const parts = closeTime.trim().split(' ');
    if (parts.length < 2) return true;
    const [timeStr, period] = parts;
    const timeParts = timeStr.split(':');
    let h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1] ?? '0', 10);
    if (isNaN(h) || isNaN(m)) return true;
    if (period?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period?.toUpperCase() === 'AM' && h === 12) h = 0;
    const close = new Date();
    close.setHours(h, m, 59, 0);
    return new Date() <= close;
  } catch {
    return true;
  }
}

function isUuid(str: string | undefined | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// ─── Chef-Side Functions ─────────────────────────────────────────────────────

// In-memory pubsub for instant local live dish updates across screens
const liveDishListeners = new Set<() => void>();

export function notifyLiveDishListeners() {
  liveDishListeners.forEach((cb) => {
    try { cb(); } catch {}
  });
}

export async function loadWeeklyDishes(
  kitchenId: string,
  weekStartDate?: string
): Promise<WeeklyDish[]> {
  const weekStart = weekStartDate ?? getWeekStart();

  let resolvedKitchenId = isUuid(kitchenId) ? kitchenId : null;
  const storeUser = useAuthStore.getState().user;
  if (!resolvedKitchenId && storeUser?.chefProfileId && isUuid(storeUser.chefProfileId)) {
    resolvedKitchenId = storeUser.chefProfileId;
  }

  if (!resolvedKitchenId) {
    const { getActiveChefProfileId } = require('./index');
    resolvedKitchenId = await getActiveChefProfileId();
  }

  if (!resolvedKitchenId) {
    return [];
  }

  const results: WeeklyDish[] = [];

  // 1. Query weekly_dishes (current week only)
  try {
    const response = await apiClient.get(`/weekly-dishes?kitchen_id=${resolvedKitchenId}&week_start_date=${weekStart}`);
    const data = response?.data || [];
    data.forEach((row: any) => results.push(rowToWeeklyDish(row)));
  } catch (err) {
    console.error('[READ PATH ERROR] loadWeeklyDishes weekly_dishes exception:', err);
  }

  // 2. Query dishes catalog so all published dishes show on weekly planner portal
  try {
    const response = await apiClient.get(`/dishes?kitchen_id=${resolvedKitchenId}`);
    const dData = response?.data || [];
    {
      const DAYS: DayKey[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayDay = DAYS[new Date().getDay()];
      dData.forEach((row: any) => {
        const rowDay = (row.day as DayKey) || (row.scheduled_day as DayKey) || todayDay;
        const alreadyExists = results.some(
          (r) => r.id === row.id || (r.dishName.toLowerCase() === (row.name || '').toLowerCase() && r.day === rowDay)
        );
        if (!alreadyExists && row.is_available) {
          results.push({
            id: row.id,
            chefId: row.kitchen_id || kitchenId,
            kitchenId: row.kitchen_id || kitchenId,
            kitchenName: 'My Kitchen',
            society: 'Lotus Heights',
            dishName: row.name || 'Dish',
            category: row.category === 'Non-Veg' || row.diet_type === 'NONVEG' ? 'Non-Veg' : 'Veg',
            foodType: row.category === 'Non-Veg' || row.diet_type === 'NONVEG' ? 'NonVeg' : 'Veg',
            mealType: 'Lunch',
            price: Number(row.price || 100),
            quantity: 10,
            maxServings: 10,
            remainingQuantity: 10,
            remainingServings: 10,
            prepTimeMinutes: Number(row.prep_time_minutes || 60),
            closeTime: '11:59 PM',
            status: 'active',
            day: rowDay,
            createdAt: row.created_at || new Date().toISOString(),
            publishedAt: row.created_at || new Date().toISOString(),
            isActive: true,
          });
        }
      });
    }
  } catch (err) {
    console.error('[READ PATH ERROR] loadWeeklyDishes dishes exception:', err);
  }

  console.log('[READ PATH SUCCESS] loadWeeklyDishes:', { kitchenId, resolvedKitchenId, totalCount: results.length });
  return results;
}

export async function saveWeeklyDish(
  kitchenId: string,
  dish: WeeklyDish,
  weekStartDate?: string
): Promise<WeeklyDish> {
  const weekStart = weekStartDate ?? getWeekStart();

  let resolvedKitchenId = isUuid(kitchenId) ? kitchenId : null;
  const storeUser = useAuthStore.getState().user;

  if (!resolvedKitchenId && storeUser?.chefProfileId && isUuid(storeUser.chefProfileId)) {
    resolvedKitchenId = storeUser.chefProfileId;
  }

  // getActiveChefProfileId() already resolves (and, as a last resort,
  // self-service-creates) the caller's own kitchen via the real backend —
  // this used to reimplement that same job here with a direct Supabase
  // lookup/auto-create (plus a dead supabase.auth.getUser() call, and a
  // "just grab any kitchen in the whole system" last-resort fallback that
  // could attach a chef's dish to someone else's kitchen entirely).
  if (!resolvedKitchenId) {
    const { getActiveChefProfileId } = require('./index');
    resolvedKitchenId = await getActiveChefProfileId();
  }

  const payload: any = {
    kitchen_id: resolvedKitchenId,
    day: dish.day,
    dish_name: dish.dishName,
    category: dish.foodType === 'NonVeg' ? 'Non-Veg' : 'Veg',
    meal_type: dish.mealType || 'Lunch',
    price: dish.price,
    quantity: dish.maxServings,
    remaining_quantity: dish.remainingServings,
    description: dish.description ?? null,
    close_time: dish.closeTime || '06:00 PM',
    // Previously derived from dish.isActive (active/paused only), which
    // silently discarded the sold_out/hidden states.
    status: dish.status || (dish.isActive ? 'active' : 'paused'),
    week_start_date: weekStart,
  };

  const isEdit = isUuid(dish.id);

  // Also sync dish into master dishes catalog for chef with day
  try {
    const dishCatalogPayload: any = {
      kitchen_id: resolvedKitchenId,
      name: dish.dishName,
      price: dish.price,
      is_available: true,
      category: dish.foodType === 'NonVeg' ? 'Non-Veg' : 'Veg',
      diet_type: dish.foodType === 'NonVeg' ? 'NONVEG' : 'VEG',
      prep_time_minutes: 60,
    };
    const existingResponse = await apiClient.get(`/dishes?kitchen_id=${resolvedKitchenId}`);
    const existingMaster = (existingResponse?.data || []).find(
      (d: any) => String(d.name).toLowerCase() === dish.dishName.toLowerCase()
    );

    if (existingMaster) {
      await apiClient.put(`/dishes/${existingMaster.id}`, dishCatalogPayload);
    } else {
      await apiClient.post('/dishes', dishCatalogPayload);
    }
  } catch (err) {
    console.warn('[WRITE PATH WARNING] saveWeeklyDish dishes master sync:', err);
  }

  let savedRow: any = null;

  try {
    if (isEdit) {
      const response = await apiClient.put(`/weekly-dishes/${dish.id}`, payload);
      savedRow = response?.data;
    } else {
      // Check if an entry already exists for this kitchen, day, dish_name and week_start_date
      const listResponse = await apiClient.get(`/weekly-dishes?kitchen_id=${resolvedKitchenId}&week_start_date=${weekStart}`);
      const existing = (listResponse?.data || []).find(
        (row: any) => row.day === dish.day && String(row.dish_name).toLowerCase() === dish.dishName.toLowerCase()
      );

      if (existing) {
        const response = await apiClient.put(`/weekly-dishes/${existing.id}`, payload);
        savedRow = response?.data;
      } else {
        const response = await apiClient.post('/weekly-dishes', payload);
        savedRow = response?.data;
      }
    }
  } catch (err) {
    console.error('[WRITE PATH ERROR] saveWeeklyDish failed:', err);
    throw err;
  }

  console.log('[WRITE PATH SUCCESS] saveWeeklyDish saved:', { id: savedRow.id, kitchenId: savedRow.kitchen_id, name: savedRow.dish_name });
  notifyLiveDishListeners();
  return rowToWeeklyDish(savedRow as Record<string, unknown>);
}

export async function deleteWeeklyDish(id: string): Promise<void> {
  const cleanId = id.replace(/-(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/, '');
  // An item in the planner list may really be a weekly_dishes row or a plain
  // dishes-catalog row merged in by loadWeeklyDishes — try both, ignoring
  // whichever one 404s.
  try {
    await apiClient.delete(`/weekly-dishes/${cleanId}`);
    console.log('[WRITE PATH SUCCESS] deleteWeeklyDish deleted:', cleanId);
  } catch (e: any) {
    console.warn('[WRITE PATH NOTICE] deleteWeeklyDish weekly-dishes attempt:', e.message);
  }
  if (isUuid(cleanId)) {
    try {
      await apiClient.delete(`/dishes/${cleanId}`);
    } catch {
      // ignore — likely wasn't a dishes-table row
    }
  }
  notifyLiveDishListeners();
}

export async function updateDishStatus(
  id: string,
  status: WeeklyDish['status']
): Promise<void> {
  const cleanId = id.replace(/-(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/, '');

  // Same "could be either table" situation as deleteWeeklyDish above.
  try {
    await apiClient.put(`/weekly-dishes/${cleanId}`, { status });
    console.log('[WRITE PATH SUCCESS] updateDishStatus updated:', { cleanId, status });
  } catch (e: any) {
    console.warn('[WRITE PATH NOTICE] updateDishStatus weekly-dishes attempt:', e.message);
  }

  if (isUuid(cleanId)) {
    try {
      await apiClient.put(`/dishes/${cleanId}`, { is_available: status === 'active' });
    } catch {
      // ignore — likely wasn't a dishes-table row
    }
  }

  notifyLiveDishListeners();
}

export async function reopenDish(id: string, originalQty: number): Promise<void> {
  await apiClient.put(`/weekly-dishes/${id}`, { status: 'active', remaining_quantity: originalQty });
}

// ─── Consumer-Side Functions ─────────────────────────────────────────────────

export async function getWeeklyDishesForConsumer(
  consumerSociety: string,
  weekStartDate?: string
): Promise<ConsumerDishItem[]> {
  const weekStart = weekStartDate ?? getWeekStart();

  const results: ConsumerDishItem[] = [];

  // 1. Live dishes from the regular menu — GET /dishes/discover already
  // joins kitchen info server-side (DishRepository.getAvailableWithKitchens),
  // same endpoint discover.tsx's main listing uses. `dishes` has no `day`
  // column at all (never did), and defaulting to 'Mon' (as this used to)
  // made the day-filtered grid hide every live dish on any day that
  // wasn't Monday — reported directly: a dish added to cart from "Explore
  // More" (kitchen/[id].tsx, which lists live dishes unfiltered by day)
  // didn't show as added on the "All Home Dishes" grid, because on a
  // non-Monday the grid could only surface that same dish via a
  // different weekly-schedule row carrying a different id. Leaving `day`
  // unset makes a live dish match every day under its one real id,
  // consistent with every other screen that reads it.
  try {
    const response = await apiClient.get('/dishes/discover');
    const liveDishesData: any[] = response?.data || [];
    console.log('[Consumer] dishes query result:', { count: liveDishesData.length });

    liveDishesData.forEach((row: any) => {
      const kt = row.kitchens;
      const kitchenAddress = (kt?.address as string) ?? '';
      const chefId = (kt?.id as string) || (row.kitchen_id as string) || '';
      const chefName = (kt?.chef_name as string) || (kt?.name as string) || 'Chef';
      const kitchenName = (kt?.name as string) || (kt?.chef_name ? `${kt.chef_name}'s Kitchen` : 'Home Kitchen');

      if (!results.some((r) => r.id === row.id)) {
        results.push({
          id: row.id,
          chefId,
          chefName,
          kitchenName,
          societyName: kitchenAddress || consumerSociety || 'Local Society',
          isSameSociety: true,
          day: row.day || undefined,
          dishName: row.name as string,
          category: (row.diet_type === 'NONVEG' || row.category === 'Non-Veg') ? 'Non-Veg' : 'Veg',
          mealType: row.meal_type || 'Lunch',
          price: Number(row.price || 100),
          discountPercent: Number(row.discount_percent || 0),
          weeklyFree: row.tags?.includes('Weekly Free') || row.is_free || false,
          sample: row.tags?.includes('Free sample') || false,
          remainingQuantity: 10,
          description: row.description || '',
          closeTime: '11:59 PM',
          status: 'active',
          isBookingOpen: true,
          kitchenOrders: Number(kt?.order_count || 0),
        });
      }
    });
  } catch (err) {
    console.warn('Live dishes query error:', err);
  }

  // 2. Weekly scheduled dishes for the current week, joined with kitchen info
  // server-side (WeeklyDishRepository.findActiveForWeek).
  try {
    const response = await apiClient.get(`/weekly-dishes?week_start_date=${weekStart}`);
    const weeklyData: any[] = response?.data || [];

    weeklyData.forEach((row: any) => {
      const kt = row.kitchens;
      const kitchenAddress = (kt?.address as string) ?? '';
      const chefId = (kt?.id as string) || (row.kitchen_id as string) || '';
      const kitchenName = (kt?.name as string) || (kt?.chef_name ? `${kt.chef_name}'s Kitchen` : 'Home Kitchen');
      const isSameSociety = consumerSociety ? kitchenAddress.toLowerCase().includes(consumerSociety.toLowerCase()) : true;
      const dName = ((row.dish_name as string) || '').toLowerCase().trim();
      const kName = kitchenName.toLowerCase().trim();
      const isTestGarbage = dName === 'fd' || dName === 't' || dName === 'fuyuyv' || kName.includes('inactive');

      const isDuplicate = results.some(
        (r) =>
          r.id === row.id ||
          (row.dish_id && r.id === row.dish_id) ||
          (r.dishName.toLowerCase() === (row.dish_name || row.name)?.toLowerCase() &&
            r.kitchenName.toLowerCase() === kitchenName.toLowerCase() &&
            // A live dish (r.day unset, see section 1 above) has no day of
            // its own and is shown every day — if the chef also scheduled
            // the same dish by name via the weekly planner, that's the same
            // dish to a consumer regardless of which day it's scheduled
            // for, so it must lose to the live entry on every day, not just
            // whichever day happened to match. Reported directly: "Home
            // screen is showing All Home Dishes section, then Top Picks,
            // then again repeat the same dishes" — this is why. Two
            // already-pushed *weekly* rows for different days still don't
            // dedupe against each other, since each day's tab needs its own.
            (!r.day || r.day.toLowerCase() === (row.day || 'Mon').toLowerCase()))
      );

      if (!isDuplicate && !isTestGarbage) {
        const closeTime = (row.close_time as string) || '06:00 PM';
        results.push({
          id: (row.dish_id as string) || (row.id as string),
          chefId,
          kitchenName,
          societyName: kitchenAddress || consumerSociety || 'Local Society',
          isSameSociety,
          day: row.day as DayKey,
          dishName: (row.dish_name as string) || 'Dish',
          category: (row.category as 'Veg' | 'Non-Veg') || 'Veg',
          mealType: (row.meal_type as string) || 'Lunch',
          price: Number(row.price || 0),
          remainingQuantity: Number(row.remaining_quantity || 10),
          description: (row.description as string) ?? undefined,
          closeTime,
          status: (row.status as ConsumerDishItem['status']) || 'active',
          isBookingOpen: computeIsBookingOpen(closeTime),
          kitchenOrders: Number(kt?.order_count || 0),
        });
      }
    });
  } catch (err) {
    console.warn('Weekly dishes query notice:', err);
  }

  // Final deduplication safety pass
  const uniqueResults: ConsumerDishItem[] = [];
  const seenKeys = new Set<string>();

  for (const item of results) {
    const dName = item.dishName.toLowerCase().trim();
    const kName = item.kitchenName.toLowerCase().trim();
    if (dName === 'fd' || dName === 't' || dName === 'fuyuyv' || kName.includes('inactive')) {
      continue;
    }
    const key = `${item.id || ''}-${item.kitchenName.toLowerCase()}-${item.dishName.toLowerCase()}-${(item.day || '').toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueResults.push(item);
    }
  }

  // No mock-data fallback on an empty result — same principle already
  // applied to DishRepository.findAll() (Phase 3.5): an empty real answer is
  // not a license to show fake dishes, and this function is in the same
  // consumer-facing critical path (discover.tsx/weekly.tsx/dish/[id].tsx).
  const kitchenIds = Array.from(new Set(uniqueResults.map((r) => r.chefId).filter(Boolean)));
  const ratings = await fetchKitchenRatings(kitchenIds);
  return uniqueResults.map((r) => ({ ...r, kitchenRating: ratings[r.chefId] ?? 0 }));
}

// ─── Realtime WebSockets Subscription ────────────────────────────────────────

/**
 * Only covers same-device updates (via the local liveDishListeners set,
 * fired by notifyLiveDishListeners() after a chef edits their own menu
 * elsewhere in this file) — it previously also opened a Supabase
 * postgres_changes subscription on the dishes/weekly_dishes tables for
 * cross-device updates, but dishes are written via Drizzle against local
 * Postgres now (Phase 1), so that subscription would never fire for a
 * write made through any real, converted endpoint. Removed rather than
 * left in place pretending to still work. Screens using this already
 * also refetch on focus (see discover.tsx/weekly.tsx's useFocusEffect),
 * so a cross-device dish change still shows up the next time the screen
 * is viewed — just not pushed instantly. A real fix needs chef menu
 * editing itself off Supabase first (saveChefDishes still writes to it
 * directly), which is a separate, larger piece of work.
 */
export function subscribeToLiveDishes(onChange: () => void): () => void {
  liveDishListeners.add(onChange);
  return () => {
    liveDishListeners.delete(onChange);
  };
}
