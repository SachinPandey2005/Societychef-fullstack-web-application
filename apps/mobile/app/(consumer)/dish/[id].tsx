import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../store/useThemeStore';
import { DISHES } from '../../../constants/data';
import { useCartStore } from '../../../store/useCartStore';
import { useFavoritesStore } from '../../../store/useFavoritesStore';
import { useReviewStore, reviewsForKitchen, averageRating } from '../../../store/useReviewStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { useRewardsStore, rupeesToPoints } from '../../../store/useRewardsStore';
import { getWeeklyDishesForConsumer, getKitchen, placeOrder } from '../../../services';
import { initiateCashfreePayment } from '../../../services/payments';
import { useAuthStore } from '../../../store/useAuthStore';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useToast } from '../../../components/ui/Toast';
import type { ConsumerDishItem } from '../../../components/ConsumerDishCard';
import type { Kitchen } from '../../../types';
import { useRecentlyViewedStore } from '../../../store/useRecentlyViewedStore';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop&q=80';

export default function DishDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dish, setDish] = useState<ConsumerDishItem | null>(null);
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const { showToast } = useToast();

  const { addItem } = useCartStore();
  const { isDishFavorite, toggleDishFavorite } = useFavoritesStore();
  const { reviews, loadReviewsForKitchen } = useReviewStore();
  const { addPoints, completeOrder } = useRewardsStore();
  const { addNotification } = useNotificationStore();
  const { addViewedId } = useRecentlyViewedStore();
  const { user } = useAuthStore();
  const consumerSociety = user?.society ?? 'Lotus Heights';

  useEffect(() => {
    // A dish not found among real weekly dishes used to fall back to a
    // fabricated static template (fake chefId: 'kavita', fake kitchen) that
    // a stale favorite/notification deep link could reach — letting someone
    // attempt to check out against IDs that don't correspond to a real
    // order. Removed: an unresolved id now shows the existing "Dish not
    // found" state instead of fabricated data to pay against.
    async function loadData() {
      setLoading(true);
      try {
        const dishes = await getWeeklyDishesForConsumer(consumerSociety);
        const found = dishes.find((d) => d.id === id);
        if (found) {
          setDish(found);
          addViewedId(found.id);
          if (found.chefId) {
            const k = await getKitchen(found.chefId).catch(() => null);
            setKitchen(k);
          }
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, consumerSociety]);

  useEffect(() => {
    if (kitchen?.id) loadReviewsForKitchen(kitchen.id);
  }, [kitchen?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('dishDetail.loading', 'Loading dish details...')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dish || !kitchen) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('dishDetail.notFound', 'Dish not found.')}</Text>
          <Button label={t('dishDetail.goBack', 'Go Back')} onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  // Find image from templates or use fallback
  const templateDish = DISHES.find((d) => d.name.toLowerCase() === dish.dishName.toLowerCase()) || 
                       DISHES.find((d) => d.id === dish.id);
  const dishImage = templateDish?.image || FALLBACK_IMAGE;

  const isFavorite = isDishFavorite(dish.id);
  const kitchenReviews = reviewsForKitchen(kitchen.id, reviews);
  const avgRating = averageRating(kitchenReviews) || kitchen.rating;

  const canBook = dish.isBookingOpen && dish.remainingQuantity > 0 && dish.status === 'active';
  const isSoldOut = dish.status === 'sold_out' || dish.remainingQuantity <= 0;

  function handleAddToCart() {
    addItem({
      kitchenId: kitchen!.id,
      dishId: dish!.id,
      quantity,
      dishName: dish!.dishName,
      kitchenName: kitchen!.name,
      price: dish!.price,
      societyName: kitchen!.society,
      imageUrl: dishImage,
    });
    showToast(t('dishDetail.addedToCart', { defaultValue: '{{count}} portion(s) of {{dish}} added to cart!', count: quantity, dish: dish!.dishName }), 'success');
  }

  async function handleDirectPreBook() {
    if (!dish || !kitchen) return;
    setBookingInProgress(true);
    try {
      const deliveryFee = dish.isSameSociety ? 10 : 35;
      const payableAmount = dish.price * quantity + deliveryFee;
      const currentUser = useAuthStore.getState().user;

      // 1. Place the order
      const order = await placeOrder({
        kitchenId: kitchen.id,
        items: [{ dishId: dish.id, quantity }],
        consumerSociety,
        allergyInfo: { tags: [], otherText: '' },
        delivery: {
          method: 'DELIVERY_PARTNER',
          fee: deliveryFee,
          deliveryAddress: {
            address: (() => {
              const u = useAuthStore.getState().user;
              return u?.address || [u?.society || consumerSociety, u?.tower, u?.flat].filter(Boolean).join(', ') || consumerSociety;
            })(),
            estimatedDeliveryTime: '30 min',
          },
        },
      });

      // 2. Initiate Cashfree Payment Gateway Checkout
      const payRes = await initiateCashfreePayment({
        orderId: order.id,
        amount: payableAmount,
        customerName: currentUser?.displayName || 'Resident',
        customerPhone: currentUser?.phone || '9999999999',
      });

      if (!payRes || !payRes.success) {
        showToast(t('dishDetail.paymentFailed', 'Payment not completed. Order saved as pending in My Orders.'), 'error');
        setShowConfirmModal(false);
        router.push('/(consumer)/orders');
        return;
      }

      const earned = rupeesToPoints(order.total);
      addPoints(earned);
      completeOrder();

      addNotification({
        type: 'order_update',
        title: t('dishDetail.prebookSuccessTitle', 'Pre-book Success!'),
        body: t('dishDetail.prebookSuccessBody', { defaultValue: 'You successfully pre-booked {{count}} portions of {{dish}} from {{kitchen}}!', count: quantity, dish: dish.dishName, kitchen: kitchen.name }),
        icon: 'checkmark-circle-outline',
        tone: 'green',
        actionRoute: '/(consumer)/orders',
      });

      setShowConfirmModal(false);
      router.push('/(consumer)/orders');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('dishDetail.bookingFailed', 'Booking failed');
      showToast(msg, 'error');
    } finally {
      setBookingInProgress(false);
    }
  }

  const getIngredients = (dishName: string) => {
    const name = dishName.toLowerCase();
    if (name.includes('paneer')) return ['Fresh Paneer', 'Green Peas/Spinach', 'Indian Spices', 'Cashew Paste', 'Ghee'];
    if (name.includes('biryani')) return ['Basmati Rice', 'Mix Veg/Chicken', 'Biryani Masala', 'Saffron', 'Rose Water'];
    if (name.includes('paratha')) return ['Wheat Flour', 'Spiced Potato Filling', 'Green Chillies', 'Butter', 'Coriander'];
    if (name.includes('cake')) return ['Cocoa Powder', 'Flour', 'Sugar', 'Butter', 'Dark Chocolate'];
    if (name.includes('idli')) return ['Rice Batter', 'Urad Dal', 'Sambar Veggies', 'Coconut', 'Mustard Seeds'];
    return ['Fresh ingredients', 'Indian spices', 'TLC (Tender Loving Care)', 'Homemade ghee'];
  };

  const ingredients = getIngredients(dish.dishName).map((ing) => t(`dishDetail.ing.${ing}`, ing));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark} />
        </Pressable>
        <Pressable style={styles.favBtn} onPress={() => toggleDishFavorite(dish.id)}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? Colors.primary : Colors.dark}
          />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Large Image */}
        <Image source={{ uri: dishImage }} style={styles.image} resizeMode="cover" />

        <View style={styles.infoSection}>
          {/* Badges row */}
          <View style={styles.badgesRow}>
            <Badge
              label={dish.category}
              tone={dish.category === 'Veg' ? 'green' : 'red'}
            />
            <Badge label={dish.mealType} tone="blue" />
            {dish.isSameSociety && <Badge label={t('dishDetail.sameSociety', 'Same Society')} tone="gold" />}
          </View>

          {/* Title & Price */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{dish.dishName}</Text>
            <Text style={styles.price}>₹{dish.price}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{dish.description}</Text>

          {/* Serving / Booking information */}
          <Card style={styles.timingCard}>
            <View style={styles.timingRow}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.timingText}>{t('dishDetail.bookingCloses', { defaultValue: 'Booking Closes: {{time}}', time: dish.closeTime })}</Text>
            </View>
            <View style={styles.timingRow}>
              <Ionicons name="timer-outline" size={18} color={Colors.primary} />
              <Text style={styles.timingText}>{t('dishDetail.estimatedServing', { defaultValue: 'Estimated Serving: {{time}}', time: dish.servingTime || t('dishDetail.defaultServingTime', 'Tonight by 7:30 PM') })}</Text>
            </View>
            <View style={styles.timingRow}>
              <Ionicons name="cube-outline" size={18} color={Colors.primary} />
              <Text style={[styles.timingText, { fontWeight: '700' }]}>
                {t('dishDetail.availableQuantity', { defaultValue: 'Available Quantity: {{count}} portions left', count: dish.remainingQuantity })}
              </Text>
            </View>
          </Card>

          {/* Chef Section */}
          <Text style={styles.sectionTitle}>{t('dishDetail.preparedBy', 'Prepared By')}</Text>
          <Pressable
            style={styles.chefCard}
            onPress={() => router.push(`/(consumer)/kitchen/${kitchen.id}` as any)}
          >
            <View style={styles.chefInfo}>
              <Text style={styles.chefKitchenName}>{kitchen.name}</Text>
              <Text style={styles.chefName}>{t('dishDetail.byChef', { defaultValue: 'By {{chef}} · {{society}}', chef: kitchen.chefName, society: kitchen.society })}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={Colors.gold} />
                <Text style={styles.ratingText}>{t('dishDetail.rating', { defaultValue: '{{rating}} Rating', rating: avgRating.toFixed(1) })}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
          </Pressable>

          {/* Ingredients list */}
          <Text style={styles.sectionTitle}>{t('dishDetail.ingredients', 'Ingredients')}</Text>
          <View style={styles.ingredientsContainer}>
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientBadge}>
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Booking Stepper and Button Section */}
      <View style={styles.bottomBar}>
        {canBook ? (
          <>
            <View style={styles.quantityRow}>
              <Text style={styles.qtyLabel}>{t('dishDetail.quantity', 'Quantity')}</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={18} color={Colors.dark} />
                </Pressable>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setQuantity(Math.min(dish.remainingQuantity, quantity + 1))}
                >
                  <Ionicons name="add" size={18} color={Colors.dark} />
                </Pressable>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.cartActionBtn} onPress={handleAddToCart}>
                <Ionicons name="cart-outline" size={22} color={Colors.primary} />
                <Text style={styles.cartActionBtnText}>{t('dishDetail.addToCart', 'Add to Cart')}</Text>
              </Pressable>
              <Pressable style={styles.bookActionBtn} onPress={() => setShowConfirmModal(true)}>
                <Text style={styles.bookActionBtnText}>{t('dishDetail.prebookNow', 'Pre-book Now')}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={[styles.closedBar, isSoldOut && styles.soldOutBar]}>
            <Text style={styles.closedBarText}>
              {isSoldOut ? t('dishDetail.soldOut', 'Sold Out') : t('dishDetail.bookingClosed', 'Booking Closed')}
            </Text>
          </View>
        )}
      </View>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('dishDetail.confirmBooking', 'Confirm Booking')}</Text>
            <Text style={styles.modalBody}>
              {t('dishDetail.confirmBody', { defaultValue: 'Are you sure you want to pre-book {{count}} portion(s) of {{dish}} from {{kitchen}}?', count: quantity, dish: dish.dishName, kitchen: kitchen.name })}
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>{t('dishDetail.cancel', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handleDirectPreBook}
                disabled={bookingInProgress}
              >
                {bookingInProgress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>{t('dishDetail.confirm', 'Confirm')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.muted,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.muted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  image: {
    width: '100%',
    height: 300,
  },
  infoSection: {
    padding: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
    flex: 1,
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  timingCard: {
    padding: 14,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    marginBottom: 20,
    gap: 8,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timingText: {
    fontSize: 13,
    color: Colors.dark,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
    marginTop: 12,
    marginBottom: 10,
  },
  chefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 16,
  },
  chefInfo: {
    flex: 1,
  },
  chefKitchenName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },
  chefName: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '600',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientBadge: {
    backgroundColor: Colors.pillInactive,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ingredientText: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  qtyLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  qtyValue: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cartActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  cartActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  bookActionBtn: {
    flex: 1.5,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  closedBar: {
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutBar: {
    backgroundColor: '#FEE2E2',
  },
  closedBarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalSheet: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalConfirmBtn: {
    backgroundColor: Colors.primary,
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
