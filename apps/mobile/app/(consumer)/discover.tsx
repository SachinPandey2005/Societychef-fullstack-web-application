import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  RefreshControl,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { getWeeklyDishesForConsumer, placeOrder, subscribeToLiveDishes, getPartyKitchens, getPartyMenu, getOrders, subscribeToOpsOrders } from '../../services';
import { PartyBuilderModal } from '../../components/PartyBuilderModal';
import { PartyKitchenSelectorModal } from '../../components/PartyKitchenSelectorModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore, selectCartCount } from '../../store/useCartStore';
import { useToast } from '../../components/ui/Toast';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { getRatingColor } from '../../lib/format';
import { NotificationBell } from '../../components/NotificationBell';
import { Pill } from '../../components/ui/Pill';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRecentlyViewedStore } from '../../store/useRecentlyViewedStore';
import { useThemeStore } from '../../store/useThemeStore';
import type { DayKey, AllergyInfo, DeliveryDetails } from '../../types';
import { ListingCard } from '../../components/ListingCard';
import { CheckoutModal } from '../../components/CheckoutModal';
import { DishDetailModal } from '../../components/DishDetailModal';
import { SearchModal } from '../../components/SearchModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useRewardsStore } from '../../store/useRewardsStore';
import { FilterModal } from '../../components/FilterModal';
import { ChefIllustration } from '../../components/ui/ChefIllustration';
import { CategoryGraphic } from '../../components/ui/CategoryGraphic';

const DAYS: DayKey[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getGreeting() {
  const hrs = new Date().getHours();
  if (hrs < 12) return 'Good Morning';
  if (hrs < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDishImage(dishName: string) {
  const normalized = dishName.toLowerCase();
  if (normalized.includes('paneer')) {
    return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80';
  }
  if (normalized.includes('chicken') || normalized.includes('biryani')) {
    return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80';
  }
  if (normalized.includes('pizza') || normalized.includes('pasta')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80';
  }
  if (normalized.includes('salad')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
}

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const cartCount = useCartStore(selectCartCount);
  const { showToast } = useToast();
  const { isDishFavorite, toggleDishFavorite } = useFavoritesStore();
  const { viewedIds } = useRecentlyViewedStore();
  const { ordersCompleted } = useRewardsStore();

  const consumerName = user?.displayName ?? 'Resident';
  const consumerSociety = user?.society || '';
  const CONSUMER_SOCIETY = consumerSociety;

  // Get current weekday key
  const todayDayIndex = new Date().getDay();
  const todayDayKey = DAYS[todayDayIndex];

  const [selectedDay, setSelectedDay] = useState<DayKey>(todayDayKey);
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  // 'New User' is the raw placeholder a brand-new signup starts with before
  // the post-OTP name step actually saves (see (auth)/otp.tsx) — showing its
  // first word verbatim ("Hello, New") looks broken if that save is ever
  // interrupted (e.g. the app being killed mid-request) or simply skipped.
  const rawDisplayName = user?.displayName;
  const firstName = rawDisplayName && rawDisplayName !== 'New User'
    ? rawDisplayName.split(' ')[0]
    : 'Guest';

  // Discover is this stack's post-login landing screen — reached after
  // dismissAll()+replace() from otp.tsx/chef-register.tsx, which is meant to
  // clear landing/phone/otp out of history but, reported directly, doesn't
  // reliably do so (hardware back from here could still reach the public
  // landing/sign-in page). Intercepting back here directly is a more
  // reliable fix than chasing the exact stack-clearing timing: standard
  // Android behavior for a logged-in app's home screen is for back to exit,
  // not reveal pre-login content — same pattern used on (chef)/dashboard.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  const [query, setQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [mealTypeFilter, setMealTypeFilter] = useState<'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('All');
  const [sortBy, setSortBy] = useState<'society' | 'price' | 'rating'>('society');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [allDishes, setAllDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const PAGE_SIZE = 12;
  const [displayedCount, setDisplayedCount] = useState<number>(PAGE_SIZE);

  const [checkoutKitchenId, setCheckoutKitchenId] = useState<string | null>(null);
  const [checkoutDishId, setCheckoutDishId] = useState<string | null>(null);
  const [selectedDishForModal, setSelectedDishForModal] = useState<{ dish: any; kitchen: any } | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // Party mode state
  const [partySelectorVisible, setPartySelectorVisible] = useState(false);
  const [partyModalVisible, setPartyModalVisible] = useState(false);
  const [partyKitchens, setPartyKitchens] = useState<any[]>([]);
  const [activePartyKitchen, setActivePartyKitchen] = useState<{ id: string; name: string } | null>(null);
  const [activePartyMenu, setActivePartyMenu] = useState<any>(null);

  // Reset display buffer whenever filter or day changes
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [query, selectedDay, vegFilter, mealTypeFilter, sortBy]);

  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  const loadDishes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWeeklyDishesForConsumer(consumerSociety);
      setAllDishes(data);
      const pkData = await getPartyKitchens();
      setPartyKitchens(pkData);
      // Use real auth user ID — falls back to empty array if not logged in
      const userId = user?.id || 'guest';
      getOrders(userId).then(setActiveOrders).catch(() => {});
    } catch {
      setAllDishes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [consumerSociety, user?.id]);

  async function openPartyBuilder(kitchenId: string, kitchenName: string) {
    setActivePartyKitchen({ id: kitchenId, name: kitchenName });
    const menu = await getPartyMenu(kitchenId);
    setActivePartyMenu(menu);
    setPartySelectorVisible(false);
    setPartyModalVisible(true);
  }

  useFocusEffect(
    useCallback(() => {
      loadDishes();
      const unsubDishes = subscribeToLiveDishes(() => {
        loadDishes();
      });
      const unsubOrders = subscribeToOpsOrders(() => {
        const userId = user?.id || 'guest';
        getOrders(userId).then(setActiveOrders).catch(() => {});
      });
      return () => {
        unsubDishes();
        unsubOrders();
      };
    }, [loadDishes])
  );

  // Derived listings state from allDishes
  const listings = allDishes
    .filter((dish) => {
      // 1. Search query filter
      const matchesQuery =
        query === '' ||
        (dish.dishName && dish.dishName.toLowerCase().includes(query.toLowerCase())) ||
        (dish.kitchenName && dish.kitchenName.toLowerCase().includes(query.toLowerCase()));

      // 2. Day filter (matching selected day tab)
      const matchesDay =
        !dish.day ||
        dish.day.toLowerCase() === selectedDay.toLowerCase();

      // 3. Veg filter
      const matchesVeg =
        vegFilter === 'All' ||
        (vegFilter === 'Veg' && (dish.category === 'Veg' || dish.foodType === 'Veg')) ||
        (vegFilter === 'Non-Veg' && (dish.category === 'Non-Veg' || dish.foodType === 'NonVeg'));

      // 4. Meal type filter (search query searches globally across all categories)
      const matchesMeal =
        (query && query.trim() !== '') ||
        mealTypeFilter === 'All' ||
        !dish.mealType ||
        dish.mealType.toLowerCase() === mealTypeFilter.toLowerCase();

      return matchesQuery && matchesDay && matchesVeg && matchesMeal;
    })
    .map((dish) => {
      return {
        kitchen: {
          id: dish.chefId,
          name: dish.kitchenName,
          chefName: 'Chef',
          society: dish.societyName,
          rating: dish.kitchenRating ?? 0,
          orders: dish.kitchenOrders ?? 0,
        },
        item: {
          dishId: dish.id,
          price: dish.price,
          discountPercent: dish.discountPercent || 0,
          weeklyFree: dish.weeklyFree || false,
          sample: dish.sample || false,
          maxOrders: dish.remainingQuantity + 5,
          currentOrders: 5,
          day: dish.day,
        },
        dish: {
          id: dish.id,
          name: dish.dishName,
          category: dish.category,
          description: dish.description || '',
          imageUrl: undefined,
        },
      };
    });

  // Sort listings
  if (sortBy === 'price') {
    listings.sort((a, b) => a.item.price - b.item.price);
  } else if (sortBy === 'rating') {
    listings.sort((a, b) => b.kitchen.rating - a.kitchen.rating);
  } else if (sortBy === 'society') {
    listings.sort((a, b) => {
      const aSame = a.kitchen.society === consumerSociety;
      const bSame = b.kitchen.society === consumerSociety;
      if (aSame && !bSame) return -1;
      if (!aSame && bSame) return 1;
      return 0;
    });
  }

  // Derived recentlyViewed list
  const recentlyViewed = allDishes
    .filter((dish) => viewedIds.includes(dish.id))
    .map((dish) => ({
      id: dish.id,
      dishName: dish.dishName,
      kitchenName: dish.kitchenName,
      price: dish.price,
      isSameSociety: dish.societyName === consumerSociety,
    }));

  // Dynamically compute Top Picks for You based on:
  // 1. Same Society Home Chefs (hyper-local priority)
  // 2. High Customer Ratings (4.5+)
  // 3. Highest Demand / Pre-orders
  const topPicks = React.useMemo(() => {
    if (!allDishes || allDishes.length === 0) {
      return [];
    }

    // allDishes deliberately holds one row per scheduled day (so the "Mon"
    // tab and the "Fri" tab can each show the same weekly dish) — fine for
    // the day-filtered main listings, but this carousel ignores the day
    // filter entirely, so the same dish/kitchen scheduled on several days
    // was appearing several times here. Dedup by dish+kitchen identity,
    // keeping the first (highest-priority, post-sort) occurrence.
    const seen = new Set<string>();
    return [...allDishes]
      .sort((a, b) => {
        // Priority 1: Same society chefs first
        const aSame = a.societyName === consumerSociety;
        const bSame = b.societyName === consumerSociety;
        if (aSame && !bSame) return -1;
        if (!aSame && bSame) return 1;
        // Priority 2: Popularity / remaining quantity
        return (b.remainingQuantity || 0) - (a.remainingQuantity || 0);
      })
      .filter((dish) => {
        const key = `${(dish.dishName || '').toLowerCase()}|${(dish.kitchenName || '').toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6)
      .map((dish) => ({
        id: dish.id,
        title: dish.dishName || 'Home Dish',
        kitchen: `by ${dish.kitchenName || 'Home Chef'}`,
        price: dish.price || 150,
        time: dish.prepTime || '25–35 min',
        rating: (dish.kitchenRating || 0).toFixed(1),
        image: getDishImage(dish.dishName),
        dishObj: {
          id: dish.id,
          name: dish.dishName,
          category: dish.category,
          description: dish.description || 'Freshly prepared home cooked dish.',
        },
        kitchenObj: {
          id: dish.chefId,
          name: dish.kitchenName,
          rating: dish.kitchenRating ?? 0,
        },
      }));
  }, [allDishes, consumerSociety]);

  const isLoading = loading;

  function openCheckout(kitchenId: string, dishId: string) {
    // Looked up against allDishes, not the day/filter-narrowed `listings` —
    // Top Picks deliberately shows dishes from every scheduled day, so a
    // dish not scheduled for *today* would never be found in `listings`,
    // leaving dishName/price blank again (the exact dummy-dish-in-cart bug
    // this lookup exists to fix).
    const matched = allDishes.find((d) => d.chefId === kitchenId && d.id === dishId);
    useCartStore.getState().addItem({
      kitchenId,
      dishId,
      quantity: 1,
      dishName: matched?.dishName,
      kitchenName: matched?.kitchenName,
      price: matched?.price,
      societyName: matched?.societyName,
      imageUrl: undefined,
    });
    router.push(`/(consumer)/kitchen/${kitchenId}`);
  }

  // The listing card's own button ("Explore More") is just a shortcut into
  // that kitchen's full menu — it must never add a dish on the consumer's
  // behalf. Deliberately separate from openCheckout, which still adds a
  // dish for the dish-detail modal's "Proceed to order" and search's "ADD
  // +" actions.
  function exploreKitchen(kitchenId: string) {
    router.push(`/(consumer)/kitchen/${kitchenId}`);
  }

  // Unlike openCheckout, this deliberately does NOT navigate — "Add to
  // Cart" is for building up an order while continuing to browse; "Order
  // Now" is the one that jumps straight to another screen.
  function handleAddToCart(listing: { kitchen: any; item: any; dish: any }) {
    useCartStore.getState().addItem({
      kitchenId: listing.kitchen.id,
      dishId: listing.item.dishId,
      quantity: 1,
      dishName: listing.dish?.name,
      kitchenName: listing.kitchen?.name,
      price: listing.item?.price,
      societyName: listing.kitchen?.society,
      imageUrl: listing.dish?.image,
    });
    showToast(t('discover.addedToCart', { defaultValue: '{{dish}} added to cart', dish: listing.dish?.name || 'Dish' }), 'success');
  }

  function closeCheckout() {
    setCheckoutKitchenId(null);
    setCheckoutDishId(null);
  }

  // NOTE: this only creates the order — it deliberately does not take payment,
  // award points, notify, or navigate. CheckoutModal charges Cashfree against
  // the real order id this returns, then handles all of that itself only once
  // payment is actually confirmed. Previously this awarded points/notified
  // immediately and CheckoutModal charged the customer using a fake id before
  // this ever ran — if this threw, the customer had already been charged with
  // no order to show for it, silently, since the failure here was swallowed.
  async function handleConfirmOrder(
    quantity: number,
    pointsUsed: number,
    allergyInfo?: AllergyInfo,
    delivery?: DeliveryDetails
  ) {
    if (!checkoutKitchenId || !checkoutDishId) throw new Error('Missing kitchen or dish selection');
    const order = await placeOrder({
      kitchenId: checkoutKitchenId,
      items: [{ dishId: checkoutDishId, quantity }],
      consumerSociety: CONSUMER_SOCIETY,
      allergyInfo: allergyInfo ?? { tags: [], otherText: '' },
      delivery: delivery ?? { method: 'PICKUP', fee: 0 },
    });
    closeCheckout();
    return order;
  }

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) {
      setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, listings.length));
    }
  };

  const remaining = Math.max(0, 5 - ordersCompleted);
  const progressWidth = Math.min(1, ordersCompleted / 5) * 100;

  const [activeHeaderTab, setActiveHeaderTab] = useState<'menu' | 'party' | 'planner'>('menu');
  const scrollViewRef = useRef<ScrollView>(null);
  const [dishesY, setDishesY] = useState<number>(0);

  const scrollToDishes = () => {
    setActiveHeaderTab('menu');
    scrollViewRef.current?.scrollTo({ y: dishesY > 0 ? dishesY : 420, animated: true });
  };

  const handleExploreNow = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setQuery('');
    setVegFilter('All');
    setMealTypeFilter('All');
    scrollToDishes();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
      {/* Top Navigation Bar */}
      <View style={[styles.topNav, { paddingLeft: 4, paddingRight: 16, paddingTop: 4, paddingBottom: 0 }]}>
        <View style={styles.topLeftNav}>
          <View style={[styles.brandContainer, { marginLeft: -14 }]}>
            <Image
              source={require('../../assets/ChatGPT Image Sep 7, 2026, 10_23_27 AM.png')}
              style={{ width: 150, height: 55 }}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.topRightNav}>
          <NotificationBell route="/(consumer)/notifications" />
          <Pressable style={styles.cartIconContainer} onPress={() => router.push('/(consumer)/cart')}>
            <Ionicons name="cart-outline" size={24} color={Colors.dark} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* User Greeting & Search Combined Header Section */}
        <View style={styles.greetingHeaderSection}>
          <View style={styles.leftGreetingCol}>
            <Text style={styles.mainGreetingText}>{t('discover.hello', 'Hello')}, {firstName} 👋</Text>
            <Text style={styles.subGreetingText}>{t('discover.goodFood', 'Good food is just a tap away!')}</Text>

            {/* Search Bar with Filter Option inside right corner */}
            <Pressable
              style={styles.searchBoxInputWrap}
              onPress={() => setSearchModalVisible(true)}
            >
              <Ionicons name="search-outline" size={18} color={Colors.muted} style={{ marginRight: 6 }} />
              <Text style={[styles.mainSearchInputText, { color: query ? Colors.dark : Colors.muted, paddingTop: 12 }]}>
                {query || t('discover.searchPlaceholder', 'Search dishes, home chefs, cuisines...')}
              </Text>
              <Pressable
                style={styles.inlineFilterIconBtn}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons name="options-outline" size={18} color={Colors.orange || Colors.primary} />
              </Pressable>
            </Pressable>
          </View>
        </View>

        {/* Track Active Meal / Active Party Order Banner */}
        {(() => {
          const activeOrder = activeOrders.find((o) => o.status !== 'delivered' && o.status !== 'cancelled');
          if (!activeOrder) return null;
          return (
            <Pressable
              style={{
                backgroundColor: '#2C1B14',
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                marginHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#D97724',
              }}
              onPress={() => router.push('/(consumer)/orders')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#D97724', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={activeOrder.isPartyOrder ? "sparkles" : "flame-outline"} size={22} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>
                      {activeOrder.isPartyOrder ? t('discover.activePartyBooking', 'Active Party Booking 🎉') : t('discover.trackActiveMeal', 'Track Active Meal 🍲')}
                    </Text>
                    <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                        {t(`orders.status.${String(activeOrder.status).toLowerCase()}`, { defaultValue: String(activeOrder.status) })}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: '#E8E1D9', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {t('discover.dishFromKitchen', { defaultValue: '{{dish}} from {{kitchen}}', dish: activeOrder.dishName, kitchen: activeOrder.kitchenName })}
                  </Text>
                </View>
              </View>
              <Text style={{ color: '#D97724', fontSize: 12, fontWeight: '700' }}>{t('discover.track', 'Track →')}</Text>
            </Pressable>
          );
        })()}

        {/* Hero Promotional Banner Card */}
        <View style={styles.heroPromoCard}>
          <Image
            source={require('../../assets/ChatGPT Image Aug 9, 2026, 03_42_27 PM.png')}
            style={styles.heroPromoBgImg}
            resizeMode="cover"
          />
          <View style={styles.heroPromoContent}>
            <View style={styles.heroPromoLeft}>
              <Text style={styles.heroPromoTitleGreen}>{t('discover.heroTitle1', 'Ghar ka Swaad,')}</Text>
              <Text style={styles.heroPromoTitleOrange}>{t('discover.heroTitle2', 'Har Ghar tak')}</Text>
              <Text style={styles.heroPromoSub}>{t('discover.heroPromoSub', 'Delicious meals from\nhome chefs near you.')}</Text>
              <Pressable style={styles.heroExploreBtn} onPress={handleExploreNow}>
                <Text style={styles.heroExploreText}>{t('discover.exploreNow', 'Explore Now  →')}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Services Promotional Section (Daily Menu, Party Mode, Weekly Planner) */}
        <View style={styles.specialServicesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialServicesScroll}>
            {/* Daily Fresh Menu Banner */}
            <Pressable
              style={styles.dailyServiceCard}
              onPress={() => {
                setActiveHeaderTab('menu');
                scrollToDishes();
              }}
            >
              <View style={styles.cardHeaderArea}>
                <View style={styles.serviceBadgeRow}>
                  <Ionicons name="leaf" size={12} color="#2D6A4F" />
                  <Text style={styles.dailyBadgeText}>{t('discover.freshToday', 'FRESH TODAY')}</Text>
                </View>
                <Text style={styles.serviceCardTitleDark}>{t('discover.dailyMenu', 'Daily Menu')}</Text>
                <Text style={styles.serviceCardSubDark}>{t('discover.dailyMenuSub', 'Fresh home-cooked meals ready for instant order.')}</Text>
              </View>
              <View style={styles.cardFooterArea}>
                <Text style={styles.dailyCtaLinkText}>{t('discover.exploreMenu', 'Explore Menu')}  →</Text>
                <Image source={require('../../assets/daily_menu_bowl.png')} style={styles.cardFoodBowlImage} resizeMode="contain" />
              </View>
            </Pressable>

            {/* Party Mode Banner */}
            <Pressable
              style={styles.partyServiceCard}
              onPress={() => {
                setActiveHeaderTab('party');
                setPartySelectorVisible(true);
              }}
            >
              <View style={styles.cardHeaderArea}>
                <View style={styles.serviceBadgeRow}>
                  <Ionicons name="sparkles" size={12} color="#E87D3E" />
                  <Text style={styles.partyBadgeText}>{t('discover.partyCatering', 'PARTY CATERING')}</Text>
                </View>
                <Text style={styles.serviceCardTitle}>{t('discover.hostingParty', 'Hosting a Party?')}</Text>
                <Text style={styles.serviceCardSub}>{t('discover.partySub', 'Custom bulk menus from expert home chefs.')}</Text>
              </View>
              <View style={styles.cardFooterArea}>
                <Text style={styles.partyCtaLinkText}>{t('discover.orderPartyMenu', 'Order Party Menu')}  →</Text>
                <Image source={require('../../assets/party_catering_bowl.png')} style={styles.cardFoodBowlImage} resizeMode="contain" />
              </View>
            </Pressable>

            {/* Weekly Planner Banner */}
            <Pressable
              style={styles.plannerServiceCard}
              onPress={() => {
                setActiveHeaderTab('planner');
                router.push('/(consumer)/weekly' as any);
              }}
            >
              <View style={styles.cardHeaderArea}>
                <View style={styles.serviceBadgeRow}>
                  <Ionicons name="calendar-outline" size={12} color="#2D6A4F" />
                  <Text style={styles.plannerBadgeText}>{t('discover.mealSubscriptions', 'MEAL SUBSCRIPTIONS')}</Text>
                </View>
                <Text style={styles.serviceCardTitleDark}>{t('discover.weeklyPlanner', 'Weekly Planner')}</Text>
                <Text style={styles.serviceCardSubDark}>{t('discover.weeklyPlannerSub', 'Pre-book lunch & dinner for the entire week.')}</Text>
              </View>
              <View style={styles.cardFooterArea}>
                <Text style={styles.plannerCtaLinkText}>{t('discover.planMyWeek', 'Plan My Week')}  →</Text>
                <Image source={require('../../assets/weekly_planner_box.png')} style={styles.cardFoodBowlImage} resizeMode="contain" />
              </View>
            </Pressable>
          </ScrollView>
        </View>

        {/* Category Horizontal Selector Pills */}
        <View style={styles.categorySectionWrap} onLayout={(e) => setDishesY(e.nativeEvent.layout.y)}>
          <Text style={styles.topCategoriesHeadingTitle}>{t('discover.topCategories', 'Top Categories')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContainer}>
            {[
              { id: 'Lunch', label: t('categories.lunch', 'Lunch') },
              { id: 'Dinner', label: t('categories.dinner', 'Dinner') },
              { id: 'Breakfast', label: t('categories.breakfast', 'Breakfast') },
              { id: 'Snacks', label: t('categories.snacks', 'Snacks') },
              { id: 'Desserts', label: t('categories.desserts', 'Desserts') },
              { id: 'More', label: t('categories.more', 'More') },
            ].map((cat) => {
              const isSelected = mealTypeFilter.toLowerCase() === cat.id.toLowerCase();
              return (
                <Pressable
                  key={cat.id}
                  style={styles.categoryItemBtn}
                  onPress={() => {
                    if (cat.id === 'More') {
                      setFilterModalVisible(true);
                    } else {
                      setMealTypeFilter((prev) => (prev.toLowerCase() === cat.id.toLowerCase() ? 'All' : cat.id as any));
                    }
                  }}
                >
                  <View style={[styles.categoryIconCircle, isSelected && styles.categoryIconCircleSelected]}>
                    <CategoryGraphic type={cat.id} isSelected={isSelected} size={52} />
                  </View>
                  <Text style={[styles.categoryItemLabel, isSelected && styles.categoryItemLabelSelected]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Dishes Feed Section Header */}
        <View style={styles.dishesFeedHeaderRow}>
          <View style={styles.dishesTitleWrap}>
            <Text style={styles.dishesFeedTitle}>{t('discover.allHomeDishes', 'All Home Dishes')}</Text>
            <View style={styles.dishesCountBadge}>
              <Text style={styles.dishesCountText}>{listings.length} {t('discover.available', 'available')}</Text>
            </View>
          </View>

          {/* Reset Filters action pill (only if filters are active) */}
          {(vegFilter !== 'All' || sortBy !== 'society' || mealTypeFilter !== 'All' || query !== '') && (
            <Pressable
              style={styles.clearAllFiltersBtn}
              onPress={() => {
                setVegFilter('All');
                setSortBy('society');
                setMealTypeFilter('All');
                setQuery('');
              }}
            >
              <Ionicons name="refresh-outline" size={12} color={Colors.primary} />
              <Text style={styles.clearAllFiltersText}>{t('discover.resetFilters', 'Reset filters')}</Text>
            </Pressable>
          )}
        </View>

        {/* Listings */}
        <View style={styles.listingsSection}>
          {isLoading ? (
            <LoadingSpinner fullscreen={false} label={t('discover.findingKitchens', 'Finding kitchens...')} />
          ) : listings.length === 0 ? (
            <>
              <EmptyState
                icon="🍽️"
                title={t('discover.noLiveTitle', 'No live dishes available')}
                body={t('discover.noLiveBody', 'No home chefs have published live dishes in your area yet. Check back soon or join as a chef!')}
                action={{
                  label: t('discover.joinAsChef', 'Join as a Chef'),
                  onPress: () => router.push('/(auth)/chef-register'),
                }}
              />
              {/* Top Picks Suggestion Box when no listings match */}
              {topPicks.length > 0 && (
                <View style={[styles.topPicksSectionWrap, { marginTop: 20 }]}>
                  <View style={styles.topPicksHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="sparkles" size={16} color={Colors.primary} />
                      <Text style={styles.topPicksTitle}>{t('discover.topPicks', 'Top Picks for You')}</Text>
                    </View>
                    <Pressable onPress={() => { setMealTypeFilter('All'); setVegFilter('All'); setQuery(''); scrollToDishes(); }}>
                      <Text style={styles.viewAllLinkText}>{t('discover.viewAll', 'View all')}</Text>
                    </Pressable>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topPicksScrollContainer}>
                    {topPicks.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.topPickCard}
                        onPress={() => {
                          if (item.dishObj && item.kitchenObj) {
                            setSelectedDishForModal({ dish: item.dishObj, kitchen: item.kitchenObj });
                          } else {
                            const matched = listings.find((l) => l.dish.name.toLowerCase().includes(item.title.toLowerCase()));
                            if (matched) {
                              setSelectedDishForModal({ dish: matched.dish, kitchen: matched.kitchen });
                            } else {
                              setSelectedDishForModal({
                                dish: { id: item.id, name: item.title, category: 'Veg', description: 'Freshly prepared home cooked dish.' },
                                kitchen: { id: 'k-1', name: item.kitchen.replace('by ', ''), rating: item.rating || 0 },
                              });
                            }
                          }
                        }}
                      >
                        <View style={styles.topPickImageWrap}>
                          <Image source={{ uri: item.image }} style={styles.topPickImage} />
                          <View style={[styles.ratingOverlayBadge, { backgroundColor: getRatingColor(item.rating) }]}>
                            <Ionicons name="star" size={11} color="#FFFFFF" />
                            <Text style={styles.ratingBadgeText}>{item.rating}</Text>
                          </View>
                        </View>

                        <View style={styles.topPickBody}>
                          <Text style={styles.topPickTitleText} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.topPickKitchenText}>{item.kitchen}</Text>
                          <Text style={styles.topPickMetaText}>
                            ₹{item.price}  •  {item.time}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <>
              {listings.slice(0, displayedCount).map((listing, idx) => (
                <React.Fragment key={`${listing.kitchen.id}-${listing.item.dishId}-${idx}`}>
                  <ListingCard
                    kitchen={listing.kitchen as any}
                    item={listing.item as any}
                    dish={listing.dish as any}
                    consumerSociety={CONSUMER_SOCIETY}
                    onExplore={() => exploreKitchen(listing.kitchen.id)}
                    onAddToCart={() => handleAddToCart(listing)}
                    onSelectDish={() => setSelectedDishForModal({ dish: listing.dish, kitchen: listing.kitchen })}
                  />

                  {/* Insert "Top Picks for You" Suggestion Box in between dishes after dish #2 */}
                  {idx === 1 && topPicks.length > 0 && (
                    <View style={[styles.topPicksSectionWrap, { marginVertical: 16, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E8E4D9' }]}>
                      <View style={styles.topPicksHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="sparkles" size={16} color={Colors.primary} />
                          <Text style={styles.topPicksTitle}>{t('discover.topPicks', 'Top Picks for You')}</Text>
                        </View>
                        <Pressable onPress={() => { setMealTypeFilter('All'); setVegFilter('All'); setQuery(''); scrollToDishes(); }}>
                          <Text style={styles.viewAllLinkText}>{t('discover.viewAll', 'View all')}</Text>
                        </Pressable>
                      </View>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topPicksScrollContainer}>
                        {topPicks.map((item) => (
                          <Pressable
                            key={item.id}
                            style={styles.topPickCard}
                            onPress={() => {
                              if (item.dishObj && item.kitchenObj) {
                                setSelectedDishForModal({ dish: item.dishObj, kitchen: item.kitchenObj });
                              } else {
                                const matched = listings.find((l) => l.dish.name.toLowerCase().includes(item.title.toLowerCase()));
                                if (matched) {
                                  setSelectedDishForModal({ dish: matched.dish, kitchen: matched.kitchen });
                                } else {
                                  setSelectedDishForModal({
                                    dish: { id: item.id, name: item.title, category: 'Veg', description: 'Freshly prepared home cooked dish.' },
                                    kitchen: { id: 'k-1', name: item.kitchen.replace('by ', ''), rating: item.rating || 0 },
                                  });
                                }
                              }
                            }}
                          >
                            <View style={styles.topPickImageWrap}>
                              <Image source={{ uri: item.image }} style={styles.topPickImage} />
                              <View style={[styles.ratingOverlayBadge, { backgroundColor: getRatingColor(item.rating) }]}>
                                <Ionicons name="star" size={11} color="#FFFFFF" />
                                <Text style={styles.ratingBadgeText}>{item.rating}</Text>
                              </View>
                            </View>

                            <View style={styles.topPickBody}>
                              <Text style={styles.topPickTitleText} numberOfLines={1}>{item.title}</Text>
                              <Text style={styles.topPickKitchenText}>{item.kitchen}</Text>
                              <Text style={styles.topPickMetaText}>
                                ₹{item.price}  •  {item.time}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </React.Fragment>
              ))}

              {/* If fewer than 2 listings, render Top Picks box below listings */}
              {listings.length < 2 && topPicks.length > 0 && (
                <View style={[styles.topPicksSectionWrap, { marginVertical: 16, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E8E4D9' }]}>
                  <View style={styles.topPicksHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="sparkles" size={16} color={Colors.primary} />
                      <Text style={styles.topPicksTitle}>{t('discover.topPicks', 'Top Picks for You')}</Text>
                    </View>
                    <Pressable onPress={() => { setMealTypeFilter('All'); setVegFilter('All'); setQuery(''); scrollToDishes(); }}>
                      <Text style={styles.viewAllLinkText}>{t('discover.viewAll', 'View all')}</Text>
                    </Pressable>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topPicksScrollContainer}>
                    {topPicks.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.topPickCard}
                        onPress={() => {
                          if (item.dishObj && item.kitchenObj) {
                            setSelectedDishForModal({ dish: item.dishObj, kitchen: item.kitchenObj });
                          } else {
                            const matched = listings.find((l) => l.dish.name.toLowerCase().includes(item.title.toLowerCase()));
                            if (matched) {
                              setSelectedDishForModal({ dish: matched.dish, kitchen: matched.kitchen });
                            } else {
                              setSelectedDishForModal({
                                dish: { id: item.id, name: item.title, category: 'Veg', description: 'Freshly prepared home cooked dish.' },
                                kitchen: { id: 'k-1', name: item.kitchen.replace('by ', ''), rating: item.rating || 0 },
                              });
                            }
                          }
                        }}
                      >
                        <View style={styles.topPickImageWrap}>
                          <Image source={{ uri: item.image }} style={styles.topPickImage} />
                          <View style={[styles.ratingOverlayBadge, { backgroundColor: getRatingColor(item.rating) }]}>
                            <Ionicons name="star" size={11} color="#FFFFFF" />
                            <Text style={styles.ratingBadgeText}>{item.rating}</Text>
                          </View>
                        </View>

                        <View style={styles.topPickBody}>
                          <Text style={styles.topPickTitleText} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.topPickKitchenText}>{item.kitchen}</Text>
                          <Text style={styles.topPickMetaText}>
                            ₹{item.price}  •  {item.time}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {displayedCount < listings.length && (
                <View style={styles.loadMoreBox}>
                  <Ionicons name="sparkles" size={16} color={Colors.primary} />
                  <Text style={styles.loadMoreText}>
                    Showing {displayedCount} of {listings.length} dishes • Scroll for more
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Dish Detail Modal (Zomato-style picture 1 popup) */}
      <DishDetailModal
        visible={!!selectedDishForModal}
        onClose={() => setSelectedDishForModal(null)}
        dish={selectedDishForModal?.dish}
        kitchen={selectedDishForModal?.kitchen}
        onOrderNow={(d, q) => {
          if (selectedDishForModal) {
            openCheckout(selectedDishForModal.kitchen.id, selectedDishForModal.dish.id);
          }
        }}
      />

      {/* Checkout modal */}
      <CheckoutModal
        visible={!!checkoutKitchenId && !!checkoutDishId}
        kitchenId={checkoutKitchenId ?? ''}
        dishId={checkoutDishId ?? ''}
        consumerSociety={CONSUMER_SOCIETY}
        onClose={closeCheckout}
        onConfirm={(qty, pts, allergy, deliv) => handleConfirmOrder(qty, pts, allergy, deliv)}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        initialSortBy={sortBy}
        initialVegFilter={vegFilter}
        initialMealTypeFilter={mealTypeFilter}
        onApply={(newSort, newVeg, newMeal) => {
          setSortBy(newSort as any);
          setVegFilter(newVeg as any);
          setMealTypeFilter(newMeal as any);
          setFilterModalVisible(false);
        }}
      />

      {/* Party Kitchen Selector Modal */}
      <PartyKitchenSelectorModal
        visible={partySelectorVisible}
        onClose={() => setPartySelectorVisible(false)}
        kitchens={partyKitchens}
        onSelectKitchen={(item) => openPartyBuilder(item.kitchenId, item.kitchenName)}
      />

      {/* Party Builder Modal */}
      <PartyBuilderModal
        visible={partyModalVisible}
        onClose={() => setPartyModalVisible(false)}
        kitchenId={activePartyKitchen?.id || 'kavita'}
        kitchenName={activePartyKitchen?.name || "Sakshi's kitchen"}
        partyMenu={activePartyMenu}
      />
      {/* Interactive Zomato/Swiggy style Search Modal */}
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        allDishes={allDishes}
        onSelectDish={(dish, kitchen) => {
          setSearchModalVisible(false);
          setSelectedDishForModal({ dish, kitchen });
        }}
        onCheckout={(kitchenId, dishId) => {
          setSearchModalVisible(false);
          openCheckout(kitchenId, dishId);
        }}
      />
      </ImageBackground>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  topModeBar: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDeep || '#3E1B15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topModePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topModePillActive: {
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.gold || '#E2A63B',
  },
  topModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4C9BC',
  },
  topModeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  topLeftNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuDrawerBtn: {
    padding: 2,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: -0.5,
  },
  brandSubTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -2,
  },
  topRightNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cartIconContainer: {
    padding: 4,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  greetingHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  leftGreetingCol: {
    flex: 1,
  },
  rightAvatarCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainGreetingText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 2,
  },
  subGreetingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  searchBoxInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainSearchInputText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    paddingVertical: 0,
    height: '100%',
  },
  inlineFilterIconBtn: {
    paddingLeft: 10,
    paddingRight: 4,
    height: '60%',
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPromoCard: {
    borderRadius: 22,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#F0EAE1',
    overflow: 'hidden',
    height: 160,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  heroPromoBgImg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroPromoContent: {
    flex: 1,
    paddingLeft: 18,
    paddingRight: 14,
    paddingVertical: 16,
    justifyContent: 'center',
    zIndex: 2,
  },
  heroPromoLeft: {
    maxWidth: '58%',
  },
  heroPromoTitleGreen: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1B4D3E',
    lineHeight: 25,
  },
  heroPromoTitleOrange: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E86A2E',
    lineHeight: 25,
    marginBottom: 6,
  },
  heroPromoSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  heroExploreBtn: {
    backgroundColor: '#1E4D3B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroExploreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  specialServicesSection: {
    marginBottom: 16,
  },
  specialServicesScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  dailyServiceCard: {
    width: 235,
    height: 185,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0EAE1',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  partyServiceCard: {
    width: 235,
    height: 185,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0EAE1',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  plannerServiceCard: {
    width: 235,
    height: 185,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0EAE1',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeaderArea: {
    flex: 1,
  },
  cardFooterArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dailyCtaLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B4332',
  },
  partyCtaLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E87D3E',
  },
  plannerCtaLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D6A4F',
  },
  cardFoodBowlImage: {
    width: 72,
    height: 72,
    marginBottom: -8,
    marginRight: -6,
  },
  dailyBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2D6A4F',
    letterSpacing: 0.5,
  },
  serviceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  partyBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E87D3E',
    letterSpacing: 0.5,
  },
  plannerBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2D6A4F',
    letterSpacing: 0.5,
  },
  serviceCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1B4332',
    marginBottom: 4,
  },
  serviceCardSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 16,
  },
  serviceCardTitleDark: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1B4332',
    marginBottom: 4,
  },
  serviceCardSubDark: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 16,
  },
  serviceActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  serviceActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  plannerActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  plannerActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  categorySectionWrap: {
    marginBottom: 20,
  },
  topCategoriesHeadingTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1B4332',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoryScrollContainer: {
    paddingHorizontal: 16,
    gap: 18,
  },
  categoryItemBtn: {
    alignItems: 'center',
    width: 64,
  },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceAlt || '#F0E5CE',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconCircleSelected: {
    backgroundColor: Colors.surfaceAlt || '#F0E5CE',
    borderColor: Colors.orange || Colors.primary,
    borderWidth: 2.5,
  },
  categoryItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
  },
  categoryItemLabelSelected: {
    color: Colors.orange || Colors.primary,
    fontWeight: '900',
  },
  topPicksSectionWrap: {
    marginBottom: 20,
  },
  topPicksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  topPicksTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  viewAllLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  topPicksScrollContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },
  topPickCard: {
    width: 170,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 102, 65, 0.35)',
  },
  topPickImageWrap: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  topPickImage: {
    width: '100%',
    height: '100%',
  },
  ratingOverlayBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(43, 33, 24, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  topPickBody: {
    padding: 10,
  },
  topPickTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 2,
  },
  topPickKitchenText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: 6,
  },
  topPickMetaText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  dishesFeedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  dishesTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dishesFeedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  dishesCountBadge: {
    backgroundColor: Colors.greenBadge || '#EAF2E6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dishesCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.green || '#51793F',
  },
  clearAllFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearAllFiltersText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationSub: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  partyBanner: {
    backgroundColor: '#352119',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 18,
  },
  partyEyebrow: {
    color: '#D97724',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  partyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  partyBody: {
    color: '#D4C9BC',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  partyBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  partyBtnText: {
    color: '#352119',
    fontSize: 13,
    fontWeight: '700',
  },
  partyKitchensSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  partyKitchenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5DFD7',
  },
  kitchenAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5E6D3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D97724',
  },
  kitchenAvatarText: {
    color: '#D97724',
    fontSize: 16,
    fontWeight: '800',
  },
  partyKitchenInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partyKitchenName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1B14',
  },
  partyKitchenSub: {
    fontSize: 12,
    color: '#8A7A70',
    marginTop: 2,
  },
  heroBanner: {
    backgroundColor: Colors.primaryDeep || '#851a1a',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  heroLeft: {
    flex: 1,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 8,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    lineHeight: 18,
  },
  challengeCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 96,
  },
  challengeLabel: {
    color: Colors.gold || '#ffd700',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  challengeProgress: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
  },
  challengeSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 13,
  },
  challengeBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  challengeBarInner: {
    height: '100%',
    backgroundColor: Colors.gold || '#ffd700',
    borderRadius: 999,
  },
  specialsSection: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  specialCard: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  specialImage: {
    width: '100%',
    height: 110,
  },
  specialInfo: {
    padding: 10,
  },
  specialDishName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
  },
  specialChefName: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  specialMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  specialPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  sameSocietyBadge: {
    backgroundColor: Colors.greenBadge,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  sameSocietyText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.green,
  },
  searchPanel: {
    marginTop: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  resultBadge: {
    backgroundColor: Colors.greenBadge,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  resultBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  searchIcon: {
    marginRight: 10,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: Colors.dark,
    fontSize: 14,
    fontWeight: '500',
  },
  clearIcon: {
    padding: 6,
    opacity: 0.5,
  },
  tabsContainer: {
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 16,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.muted,
  },
  tabTextActive: {
    color: '#fff',
  },
  filtersContainer: {
    marginTop: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  mainFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  mainFilterText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
  },
  chipBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
  chipTextActive: {
    color: '#fff',
  },
  chipCloseIcon: {
    marginLeft: 6,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
  },
  sortBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sortBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.greenBadge,
  },
  sortBtnText: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  listingsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  dishCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    flexDirection: 'row',
  },
  cardImage: {
    width: 110,
    height: '100%',
    minHeight: 130,
  },
  cardFavOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vegDot: {
    fontSize: 12,
  },
  cardDishName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
    flex: 1,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.dark,
  },
  cardKitchenName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  cardSocietyName: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  cardMeta: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardQty: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  cardBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardKitchenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffdf5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  cardRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    marginLeft: 3,
  },
  loadMoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.muted,
  },
});
