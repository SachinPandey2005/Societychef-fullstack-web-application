import { isMockMode } from '../../lib/mockMode';
import { apiClient } from '../../lib/apiClient';
import type { PartyMenu, PartyOrderSelection, Order } from '../../types';

export async function getPartyMenu(kitchenId: string): Promise<PartyMenu | null> {
  try {
    const { useAuthStore } = await import('../../store/useAuthStore');
    const storeUser = useAuthStore.getState().user;
    const finalKitchenId = kitchenId.length === 36 ? kitchenId : (storeUser?.chefProfileId || kitchenId);

    const response = await apiClient.get(`/party/menu/${finalKitchenId}`);
    const data = response?.data;
    if (!data) return null;

    return {
      kitchenId: data.kitchen_id,
      isEnabled: data.is_enabled,
      minGuests: data.min_guests,
      advanceNoticeHours: data.advance_notice_hours,
      packages: data.packages || [],
      dishes: data.dishes || [],
    };
  } catch (err) {
    console.warn('getPartyMenu error:', err);
    return null;
  }
}

export async function savePartyMenu(kitchenId: string, partyMenu: PartyMenu): Promise<PartyMenu> {
  const { useAuthStore } = await import('../../store/useAuthStore');
  const storeUser = useAuthStore.getState().user;
  const finalKitchenId = kitchenId.length === 36 ? kitchenId : (storeUser?.chefProfileId || kitchenId);

  const response = await apiClient.put(`/party/menu/${finalKitchenId}`, {
    is_enabled: partyMenu.isEnabled,
    min_guests: partyMenu.minGuests,
    advance_notice_hours: partyMenu.advanceNoticeHours,
    packages: partyMenu.packages,
    dishes: partyMenu.dishes,
  });
  const data = response.data;

  return {
    kitchenId: data.kitchen_id,
    isEnabled: data.is_enabled,
    minGuests: data.min_guests,
    advanceNoticeHours: data.advance_notice_hours,
    packages: data.packages || [],
    dishes: data.dishes || [],
  };
}

export async function getPartyKitchens(): Promise<{ kitchenId: string; kitchenName: string; society?: string; rating?: number; minGuests: number; minPricePerHead: number; tags?: string[] }[]> {
  try {
    const response = await apiClient.get('/party/kitchens');
    const kitchensData = response?.data || [];

    const filtered = kitchensData.filter((k: any) => {
      const normName = (k.name || '').toLowerCase().trim();
      return normName !== '' && !normName.includes('inactive') && normName !== 'home kitchen';
    });

    // Real rating per kitchen — minGuests/minPricePerHead already come from
    // the kitchen's own saved party menu (apiClient call above), previously
    // hardcoded to the same 8 guests / ₹250 for every kitchen regardless of
    // what they actually configured.
    let ratings: Record<string, number> = {};
    try {
      const ids = filtered.map((k: any) => k.kitchen_id).filter(Boolean);
      if (ids.length > 0) {
        const statsResponse = await apiClient.get(`/kitchens/stats?ids=${ids.join(',')}`);
        const statsMap = statsResponse?.data || {};
        for (const id of ids) ratings[id] = statsMap[id]?.rating ?? 0;
      }
    } catch {
      // ratings stay unset — UI already handles a missing rating
    }

    return filtered.map((k: any) => {
      const packages = Array.isArray(k.packages) ? k.packages : [];
      const minPricePerHead = packages.length > 0
        ? Math.min(...packages.map((p: any) => Number(p.pricePerHead) || Infinity))
        : 0;
      return {
        kitchenId: k.kitchen_id,
        kitchenName: k.name || (k.chef_name ? `${k.chef_name}'s Kitchen` : 'Kitchen'),
        society: k.address || '',
        rating: ratings[k.kitchen_id] || undefined,
        minGuests: Number(k.min_guests) || 8,
        minPricePerHead,
        // No real cuisine-tag data exists on party menus yet — kept as a
        // display-only default rather than invented per-kitchen data.
        tags: ['veg', 'jain', 'punjabi'],
      };
    });
  } catch (err) {
    console.warn('getPartyKitchens error:', err);
    return [];
  }
}

export async function placePartyOrder(sel: PartyOrderSelection): Promise<Order> {
  if (isMockMode) {
    const { placePartyOrder: mockPlacePartyOrder } = await import('../mock/partyService');
    return mockPlacePartyOrder(sel);
  }

  const { useAuthStore } = await import('../../store/useAuthStore');
  const storeUser = useAuthStore.getState().user;

  // Backend resolves kitchen_id itself (exact id, or a loose name match for
  // legacy slug-style ids) and always books under the authenticated user —
  // see party.controller.ts#createMyPartyOrder. total_amount/per_head_price
  // are sent for reference only; the backend independently recomputes both
  // from the kitchen's real party menu and never trusts these values.
  const response = await apiClient.post('/party/orders', {
    kitchen_id: sel.kitchenId,
    total_amount: sel.totalAmount,
    delivery_address: sel.deliveryAddress || 'Lotus Heights',
    booking_date: sel.bookingDate,
    guest_count: sel.guestCount,
    pack_id: sel.packId,
    pack_name: sel.packName,
    per_head_price: sel.totalPerHead,
    selected_dishes: sel.selectedDishes,
    kids_count: sel.kidsCount || 0,
  });
  const insertedPartyOrder = response.data;

  return {
    id: insertedPartyOrder.id,
    kitchenId: insertedPartyOrder.kitchen_id,
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
    createdAt: insertedPartyOrder.created_at || new Date().toISOString(),
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
    partyDishes: sel.selectedDishes,
    paymentStatus: 'PENDING',
  } as Order;
}
