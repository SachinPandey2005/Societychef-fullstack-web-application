import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useCartStore } from '../store/useCartStore';
import { money, getRatingColor } from '../lib/format';
import type { Kitchen, KitchenDish, Dish } from '../types';
import { Badge } from './ui/Badge';
import { DishVisual } from './ui/DishVisual';

interface ListingCardProps {
  kitchen: Kitchen;
  item: KitchenDish;
  dish: Dish;
  consumerSociety: string;
  onExplore: () => void;
  onAddToCart: () => void;
  onSelectDish?: () => void;
}

export function ListingCard({
  kitchen,
  item,
  dish,
  consumerSociety,
  onExplore,
  onAddToCart,
  onSelectDish,
}: ListingCardProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark);
  const router = useRouter();

  // Reported directly: "Once added to cart, that dish should reflect that
  // already added in cart. It does not reflect." Reads the cart directly
  // (same kitchenId+dishId keying kitchen/[id].tsx's own stepper already
  // uses) so this card switches to a +/- stepper the instant the dish is in
  // the cart, from anywhere that adds it — not just this card's own button.
  const cartItems = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartQty = cartItems.find((i) => i.kitchenId === kitchen.id && i.dishId === item.dishId)?.quantity || 0;

  const sameSociety = kitchen.society === consumerSociety;
  const customDiscountPct = item.discountPercent || 0;
  const effectiveDiscountPct = customDiscountPct > 0 ? customDiscountPct : (sameSociety ? 10 : 0);
  const finalPrice = effectiveDiscountPct > 0 ? Math.round(item.price * (1 - effectiveDiscountPct / 100)) : item.price;
  const kitchenDisplay = kitchen.anonymous
    ? t('listingCard.anonKitchen', { defaultValue: '{{name}} in {{society}}', name: kitchen.name, society: kitchen.society })
    : kitchen.name;

  const isVeg = dish.category?.toLowerCase() !== 'non-veg' && !(dish.name?.toLowerCase().includes('chicken') || dish.name?.toLowerCase().includes('mutton') || dish.name?.toLowerCase().includes('fish') || dish.name?.toLowerCase().includes('egg'));

  const vegColor = Colors.green || '#51793F';
  const nonVegColor = Colors.red || '#A8362A';

  return (
    <View style={[styles.cardContainer, sameSociety && styles.featuredBorder]}>
      <Pressable onPress={onSelectDish} accessibilityRole="button" accessibilityLabel={t('listingCard.viewDetails', { defaultValue: 'View details for {{name}}', name: dish.name })}>
        {/* 1. TOP BAR: VEG/NON-VEG TAG + FRESH TODAY BADGE + PRICE */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            {/* Veg / Non-Veg Indicator Badge */}
            <View style={[styles.dietBadge, isVeg ? styles.dietBadgeVeg : styles.dietBadgeNonVeg]}>
              <View style={[styles.dietDot, { backgroundColor: isVeg ? vegColor : nonVegColor }]} />
              <Text style={[styles.dietText, { color: isVeg ? vegColor : nonVegColor }]}>
                {isVeg ? t('listingCard.veg', 'VEG') : t('listingCard.nonVeg', 'NON-VEG')}
              </Text>
            </View>

            {/* Fresh Today Badge */}
            <View style={styles.freshBadge}>
              <Ionicons name="sparkles" size={11} color={Colors.orange || '#e65100'} />
              <Text style={styles.freshBadgeText}>{t('listingCard.freshToday', 'Fresh Today')}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {effectiveDiscountPct > 0 && (
              <Text style={{ fontSize: 13, textDecorationLine: 'line-through', color: Colors.muted, fontWeight: '600' }}>
                ₹{item.price}
              </Text>
            )}
            <Text style={styles.price}>{money(finalPrice)}</Text>
          </View>
        </View>

        {/* 2. CHEF AVATAR & DISH INFO ROW */}
        <View style={styles.mainInfoRow}>
          <DishVisual dish={dish} size="md" />

          <View style={styles.dishDetails}>
            <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
            <Pressable onPress={() => router.push(`/(consumer)/kitchen/${kitchen.id}`)}>
              <View style={styles.kitchenRow}>
                <Ionicons name="restaurant-outline" size={13} color={Colors.primary} />
                <Text style={styles.kitchenName} numberOfLines={1}>
                  {kitchenDisplay}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* 3. METRICS PILLS ROW (Rating, Prep Time, Distance) */}
        <View style={styles.metricsRow}>
          {kitchen.rating > 0 ? (
            <View style={[styles.ratingPill, { backgroundColor: getRatingColor(kitchen.rating) }]}>
              <Ionicons name="star" size={12} color="#FFFFFF" />
              <Text style={[styles.ratingText, { color: '#FFFFFF' }]}>{kitchen.rating}</Text>
            </View>
          ) : (
            <View style={[styles.ratingPill, { backgroundColor: Colors.muted }]}>
              <Text style={[styles.ratingText, { color: '#FFFFFF' }]}>{t('listingCard.notRated', 'Not Rated')}</Text>
            </View>
          )}

          <View style={styles.metricPill}>
            <Ionicons name="time-outline" size={13} color={Colors.muted} />
            <Text style={styles.metricText}>{t('listingCard.mins', { defaultValue: '{{count}} min', count: item.leadTimeMinutes || 25 })}</Text>
          </View>

          <View style={styles.metricPill}>
            <Ionicons name="location-outline" size={13} color={Colors.muted} />
            <Text style={styles.metricText}>{t('listingCard.km', { defaultValue: '{{count}} km', count: kitchen.distanceKm || 1.2 })}</Text>
          </View>
        </View>

        {/* 4. TRUST SUBTEXT & BADGES */}
        <View style={styles.trustRow}>
          <Text style={styles.trustText}>
            {t('listingCard.trustLine', { defaultValue: '{{orders}} Orders • Homemade • Fresh Today', orders: kitchen.orders ?? 0 })}
          </Text>

          <View style={styles.badgesRow}>
            {customDiscountPct > 0 ? (
              <Badge label={t('listingCard.pctOff', { defaultValue: '{{pct}}% OFF', pct: customDiscountPct })} tone="green" small />
            ) : sameSociety ? (
              <Badge label={t('listingCard.sameSocietyOff', '10% off')} tone="green" small />
            ) : null}
            {item.weeklyFree && <Badge label={t('listingCard.freeWeeklySample', 'FREE Weekly Sample')} tone="gold" small />}
            {item.sample && <Badge label={t('listingCard.sampleAvailable', 'Sample Available')} tone="gold" small />}
            {kitchen.hygieneBadge && <Badge label={t('listingCard.hygieneBadge', 'Hygiene badge')} tone="blue" small />}
          </View>
        </View>
      </Pressable>

      {/* 5. ACTION BUTTONS ROW */}
      {/* Chatting with a chef before ever placing an order was removed here —
          a consumer has no relationship with a kitchen to discuss until they
          actually order from it. Chat is only reachable from a real order
          (orders list / order detail), both already correctly gated. */}
      <View style={styles.actionRow}>
        {cartQty === 0 ? (
          <Pressable
            style={({ pressed }) => [styles.addToCartBtn, pressed && styles.btnPressed]}
            onPress={onAddToCart}
          >
            <Ionicons name="cart-outline" size={16} color={Colors.primary} />
            <Text style={styles.addToCartBtnText}>{t('listingCard.addToCart', 'Add to Cart')}</Text>
          </Pressable>
        ) : (
          <View style={styles.stepperWrap}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => updateQuantity(kitchen.id, item.dishId, cartQty - 1)}
            >
              <Ionicons name="remove" size={16} color={Colors.primary} />
            </Pressable>
            <Text style={styles.stepperQty}>{cartQty}</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => updateQuantity(kitchen.id, item.dishId, cartQty + 1)}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
            </Pressable>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [styles.orderBtn, pressed && styles.btnPressed]}
          onPress={onExplore}
        >
          <Text style={styles.orderBtnText}>{t('listingCard.exploreMore', 'Explore More')}</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  cardContainer: {
    backgroundColor: isDark ? Colors.surface : '#FFF9F3',
    borderWidth: 1,
    borderColor: 'rgba(56, 102, 65, 0.35)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: isDark ? '#000000' : '#8a4b10',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  featuredBorder: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dietBadgeVeg: {
    backgroundColor: isDark ? 'rgba(104, 176, 77, 0.18)' : 'rgba(20, 107, 75, 0.1)',
  },
  dietBadgeNonVeg: {
    backgroundColor: isDark ? 'rgba(224, 83, 67, 0.18)' : 'rgba(201, 71, 55, 0.1)',
  },
  dietDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dietText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  freshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? 'rgba(245, 150, 83, 0.18)' : '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freshBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.orange || '#e65100',
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  dishDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  dishName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 4,
  },
  kitchenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kitchenName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? 'rgba(245, 190, 79, 0.18)' : 'rgba(217, 152, 37, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ratingText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.gold || '#b87a0f',
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
  },
  trustRow: {
    marginBottom: 14,
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 11,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  orderBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 11,
  },
  addToCartBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepperWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  stepperQty: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
