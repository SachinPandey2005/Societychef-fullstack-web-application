import React, { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { useWeeklyStore, DAYS, DAY_LABELS, type DayOfWeek, type WeeklyDish } from '../../store/useWeeklyStore';
import { useFocusEffect, router } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { placeOrder, cancelOrder, getWeeklyDishesForConsumer, subscribeToLiveDishes } from '../../services';
import type { ConsumerDishItem } from '../../components/ConsumerDishCard';
import { DishDetailModal } from '../../components/DishDetailModal';
import { Button } from '../../components/ui/Button';
import { money } from '../../lib/format';
import { getWeekDates, formatNiceDate, getTodayISODate } from '../../lib/dateUtils';

const STATUS_COLORS = { pending: '#d99825', confirmed: '#146b4b', cancelled: '#c94737' };
const STATUS_LABELS: Record<string, string> = { pending: 'Awaiting Chef', confirmed: 'Confirmed', cancelled: 'Cancelled' };
const statusLabel = (t: TFunction, s: string) => t(`weekly.status.${s}`, STATUS_LABELS[s] ?? s);
const dayLabel = (t: TFunction, d: string) => t(`weekly.day.${d}`, DAY_LABELS[d as DayOfWeek] ?? d);
const dayShort = (t: TFunction, d: string) => t(`weekly.dayShort.${d}`, d);

function toWeeklyDish(item: ConsumerDishItem): WeeklyDish {
  return {
    id: item.id,
    chefId: item.chefId,
    kitchenId: item.chefId,
    kitchenName: item.kitchenName,
    society: item.societyName,
    day: item.day,
    dishName: item.dishName,
    category: item.category,
    foodType: item.category === 'Non-Veg' ? 'NonVeg' : 'Veg',
    mealType: item.mealType,
    price: item.price,
    quantity: item.remainingQuantity,
    maxServings: item.remainingQuantity,
    remainingQuantity: item.remainingQuantity,
    remainingServings: item.remainingQuantity,
    prepTimeMinutes: 60,
    description: item.description,
    closeTime: item.closeTime,
    servingTime: item.servingTime,
    status: item.status,
    isActive: item.status === 'active' && item.isBookingOpen,
  };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ConsumerWeeklyScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const styles = getStyles(Colors, isDark);
  const { user } = useAuthStore();
  const { weeklyDishes: localWeeklyDishes, preBookings, preBookDish, cancelPreBook } = useWeeklyStore();
  const [liveDishes, setLiveDishes] = useState<WeeklyDish[] | null>(null);

  const calendarDates = getWeekDates(new Date(), 14); // Next 14 calendar dates
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayISODate());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Tue');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const [bookingTarget, setBookingTarget] = useState<WeeklyDish | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [detailDish, setDetailDish] = useState<WeeklyDish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'browse' | 'mybookings'>('browse');

  const society = user?.society ?? 'Lotus Heights';
  const flat = user?.flat || '';

  const refetchDishes = useCallback(async () => {
    try {
      const items = await getWeeklyDishesForConsumer(society);
      setLiveDishes(items.map(toWeeklyDish));
    } catch (e) {
      console.warn('Failed to load weekly dishes:', e);
    }
  }, [society]);

  useEffect(() => {
    refetchDishes();
  }, [refetchDishes]);

  // Previously this only reads local per-device storage, so dishes chefs
  // published never reached consumers on a different device — now backed by
  // the real cross-kitchen query, with the local store as a mock-mode/
  // fallback source.
  const weeklyDishes = liveDishes || [];
  const dishesForDay = weeklyDishes.filter((d) => d.day === selectedDay && d.isActive);
  const myBookings = preBookings;
  const activeBookings = myBookings.filter((b) => b.status !== 'cancelled');

  useFocusEffect(
    useCallback(() => {
      refetchDishes();
      const unsubscribe = subscribeToLiveDishes(() => {
        refetchDishes();
      });
      return () => {
        unsubscribe();
      };
    }, [refetchDishes])
  );

  async function handlePreBook() {
    if (!bookingTarget) return;
    if (quantity > bookingTarget.remainingServings) {
      Alert.alert(t('weekly.notEnoughTitle', 'Not enough servings'), t('weekly.notEnoughBody', { defaultValue: 'Only {{count}} servings left.', count: bookingTarget.remainingServings }));
      return;
    }

    const targetKitchenId = bookingTarget.kitchenId || bookingTarget.chefId;
    const cleanDishId = bookingTarget.id.replace(/-(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/, '');
    if (!targetKitchenId) {
      Alert.alert(t('weekly.bookingFailedTitle', 'Booking failed'), t('weekly.bookingFailedBody', 'This dish is missing its kitchen — please try again.'));
      return;
    }

    setBookingInProgress(true);
    let placedOrder: Awaited<ReturnType<typeof placeOrder>>;
    try {
      // Previously this recorded the booking locally and fired placeOrder
      // without awaiting it (errors silently swallowed), so the "Pre-booked!"
      // success alert showed regardless of whether the real order — the only
      // thing that actually notifies the chef — succeeded. The backend now
      // also atomically decrements remaining servings itself (see
      // OrderService.createDirectOrder), so the separate client-computed
      // updateRemainingQuantity call is gone too — it was racy under
      // concurrent bookings and is now redundant.
      placedOrder = await placeOrder({
        kitchenId: targetKitchenId,
        items: [{ dishId: cleanDishId, quantity }],
        consumerSociety: society,
        allergyInfo: { tags: [], otherText: `Pre-booking for ${bookingTarget.day}` },
        delivery: {
          method: 'PICKUP',
          fee: 0,
          deliveryAddress: {
            address: `${society}, ${flat}`,
            estimatedDeliveryTime: bookingTarget.day,
          },
        },
      });
    } catch (err: any) {
      setBookingInProgress(false);
      Alert.alert(
        t('weekly.bookingFailedTitle', 'Booking failed'),
        err?.message || t('weekly.bookingFailedBody', 'This dish is missing its kitchen — please try again.')
      );
      return;
    }
    setBookingInProgress(false);

    preBookDish({
      orderId: placedOrder.id,
      weeklyDishId: bookingTarget.id,
      dishName: bookingTarget.dishName,
      kitchenId: targetKitchenId,
      kitchenName: bookingTarget.kitchenName || t('weekly.homeKitchen', 'Home Kitchen'),
      society: bookingTarget.society || 'Lotus Heights',
      day: bookingTarget.day,
      quantity,
      totalAmount: bookingTarget.price * quantity,
      customerFlat: flat,
      customerSociety: society,
    });

    refetchDishes();

    setBookingTarget(null);
    setQuantity(1);

    // Suggest ordering for next day if not scheduled yet
    const dayOrder: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentIdx = dayOrder.indexOf(bookingTarget.day);
    if (currentIdx !== -1) {
      const nextDayKey = dayOrder[(currentIdx + 1) % dayOrder.length];
      const hasNextDayBooking = activeBookings.some((b) => b.day === nextDayKey);
      if (!hasNextDayBooking) {
        import('../../services/notifications').then(({ sendMissingDayOrderReminder }) => {
          sendMissingDayOrderReminder(
            dayLabel(t, bookingTarget.day),
            dayLabel(t, nextDayKey),
            bookingTarget.dishName
          );
        });
      }
    }

    Alert.alert(
      t('weekly.prebookedTitle', 'Pre-booked! 🎉'),
      t('weekly.prebookedBody', { defaultValue: '{{dish}} on {{day}} is reserved. The chef will confirm shortly.', dish: bookingTarget.dishName, day: dayLabel(t, bookingTarget.day) }),
    );
  }

  async function handleCancelBooking(bookingId: string, orderId: string) {
    // Previously this only flipped local AsyncStorage state to 'cancelled' —
    // it never called the backend at all, so the real order (the thing the
    // chef actually sees and prepares against) stayed active, and no refund
    // or weekly-dish restock (OrderService.updateOrderStatus's CANCELLED
    // branch) ever ran. The consumer saw "Cancelled" while the chef still
    // had a live order to fulfill.
    try {
      await cancelOrder(orderId);
    } catch (err: any) {
      Alert.alert(
        t('weekly.cancelFailedTitle', 'Cancel failed'),
        err?.message || t('weekly.cancelFailedBody', 'Could not cancel this booking. Please try again.')
      );
      return;
    }
    cancelPreBook(bookingId);
    refetchDishes();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ImageBackground
        source={require('../../assets/doodle_bg.png')}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.12 }}
        resizeMode="repeat"
      >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[Colors.primaryDeep, '#7a1515', Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Back button to return to Discover Home screen */}
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(0,0,0,0.3)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
            onPress={() => router.push('/(consumer)/discover')}
          >
            <Ionicons name="arrow-back" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>{t('weekly.backToDiscover', 'Back to Discover')}</Text>
          </Pressable>

          <Text style={styles.headerEyebrow}>{t('weekly.thisWeek', 'THIS WEEK')}</Text>
          <Text style={styles.headerTitle}>{t('weekly.weeklySpecials', 'Weekly Specials')}</Text>
          <Text style={styles.headerSub}>{t('weekly.headerSub', 'Pre-book fresh home-cooked dishes ahead of time.')}</Text>

          <View style={styles.headerStats}>
            <StatPill icon="restaurant-outline" value={String(weeklyDishes.filter(d => d.isActive).length)} label={t('weekly.dishesLive', 'Dishes live')} />
            <StatPill icon="bookmark-outline" value={String(activeBookings.length)} label={t('weekly.myBookings', 'My bookings')} />
          </View>
        </LinearGradient>

        {/* ── Segment ─────────────────────────────────────────────────────── */}
        <View style={styles.segmentWrap}>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segBtn, activeTab === 'browse' && styles.segBtnActive]}
              onPress={() => setActiveTab('browse')}
            >
              <Text style={[styles.segBtnText, activeTab === 'browse' && styles.segBtnTextActive]}>{t('weekly.browseDishes', 'Browse Dishes')}</Text>
            </Pressable>
            <Pressable
              style={[styles.segBtn, activeTab === 'mybookings' && styles.segBtnActive]}
              onPress={() => setActiveTab('mybookings')}
            >
              <Text style={[styles.segBtnText, activeTab === 'mybookings' && styles.segBtnTextActive]}>
                {activeBookings.length > 0 ? t('weekly.myPrebookingsCount', { defaultValue: 'My Pre-bookings ({{count}})', count: activeBookings.length }) : t('weekly.myPrebookings', 'My Pre-bookings')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── BROWSE TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'browse' && (
          <View style={styles.padded}>
            {/* Missing Tomorrow Order Suggestion Banner Card */}
            {(() => {
              const todayItem = calendarDates.find((c) => c.isToday) || calendarDates[0];
              const tomorrowItem = calendarDates.find((c) => c.isTomorrow) || calendarDates[1];
              const hasTodayBooking = activeBookings.some((b) => b.day === todayItem?.dayKey);
              const hasTomorrowBooking = activeBookings.some((b) => b.day === tomorrowItem?.dayKey);
              
              if (hasTodayBooking && !hasTomorrowBooking && tomorrowItem) {
                const lastBooking = activeBookings.find((b) => b.day === todayItem?.dayKey);
                return (
                  <View style={styles.reminderBannerCard}>
                    <View style={styles.reminderBannerLeft}>
                      <Text style={styles.reminderBannerTitle}>{t('weekly.forgotTomorrow', { defaultValue: '🍱 Forgot meal for Tomorrow ({{day}})?', day: dayLabel(t, tomorrowItem.dayKey) })}</Text>
                      <Text style={styles.reminderBannerBody}>
                        {t('weekly.forgotTomorrowBody', { defaultValue: "You've booked for today, but missed ordering for tomorrow! Tap to order or repeat last meal{{suffix}}.", suffix: lastBooking ? t('weekly.forgotTomorrowSuffix', { defaultValue: ' ({{dish}})', dish: lastBooking.dishName }) : '' })}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.reminderBannerBtn}
                      onPress={() => {
                        setSelectedDateStr(tomorrowItem.dateStr);
                        setSelectedDay(tomorrowItem.dayKey);
                      }}
                    >
                      <Text style={styles.reminderBannerBtnText}>{t('weekly.orderNow', 'Order Now')}</Text>
                    </Pressable>
                  </View>
                );
              }
              return null;
            })()}

            {/* Calendar Date Strip Header */}
            <View style={styles.calendarStripHeader}>
              <Text style={styles.calendarStripLabel}>{t('weekly.selectDate', 'SELECT PRE-BOOKING DATE')}</Text>
              <Pressable style={styles.calendarPickerBtn} onPress={() => setShowDatePickerModal(true)}>
                <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                <Text style={styles.calendarPickerText}>{t('weekly.calendarView', 'Calendar View')}</Text>
              </Pressable>
            </View>

            {/* Date selector strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
              {calendarDates.map((item) => {
                const isSelected = item.dateStr === selectedDateStr;
                const count = weeklyDishes.filter((dish) => {
                  if (!dish.isActive) return false;
                  if (dish.date) return dish.date === item.dateStr;
                  return dish.day === item.dayKey && item.isCurrentWeek;
                }).length;

                return (
                  <Pressable
                    key={item.dateStr}
                    style={[styles.dateChip, isSelected && styles.dateChipActive]}
                    onPress={() => {
                      setSelectedDateStr(item.dateStr);
                      setSelectedDay(item.dayKey);
                    }}
                  >
                    <Text style={[styles.dateChipLabel, isSelected && styles.dateChipLabelActive]}>
                      {item.isToday ? t('weekly.today', 'Today') : (item.isTomorrow ? t('weekly.tomorrow', 'Tomorrow') : dayShort(t, item.dayKey))}
                    </Text>
                    <Text style={[styles.dateChipNum, isSelected && styles.dateChipNumActive]}>
                      {item.dateNum}
                    </Text>
                    <View style={[styles.dateBadge, isSelected && styles.dateBadgeActive]}>
                      <Text style={[styles.dateBadgeText, isSelected && styles.dateBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.selectedDateBanner}>
              <Ionicons name="calendar" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>{t('weekly.dateSpecials', { defaultValue: '{{date}} Specials', date: formatNiceDate(selectedDateStr) })}</Text>
            </View>

            {(() => {
              const selectedCalendarItem = calendarDates.find((item) => item.dateStr === selectedDateStr) || calendarDates[0];
              const dishesForDate = weeklyDishes.filter((dish) => {
                if (!dish.isActive) return false;
                if (dish.date) return dish.date === selectedDateStr;
                return dish.day === selectedCalendarItem.dayKey && selectedCalendarItem.isCurrentWeek;
              });

              if (dishesForDate.length === 0) {
                return (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🍽️</Text>
                    <Text style={styles.emptyTitle}>{t('weekly.nothingScheduled', { defaultValue: 'Nothing scheduled for {{date}}', date: formatNiceDate(selectedDateStr) })}</Text>
                    <Text style={styles.emptyBody}>{t('weekly.nothingScheduledBody', 'No home-cooked specials available for this date yet. Check back soon or select another date on the calendar.')}</Text>
                  </View>
                );
              }

              return dishesForDate.map((dish) => {
                const alreadyBooked = preBookings.some(
                  (b) => b.weeklyDishId === dish.id && b.customerSociety === society && b.status !== 'cancelled',
                );
                return (
                  <WeeklyDishCard
                    key={dish.id}
                    dish={dish}
                    alreadyBooked={alreadyBooked}
                    Colors={Colors}
                    styles={styles}
                    onPreBook={() => {
                      setBookingTarget(dish);
                      setQuantity(1);
                    }}
                    onSelectDish={() => setDetailDish(dish)}
                  />
                );
              });
            })()}
          </View>
        )}

        {/* ── MY BOOKINGS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'mybookings' && (
          <View style={styles.padded}>
            {myBookings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>{t('weekly.noPrebookings', 'No pre-bookings')}</Text>
                <Text style={styles.emptyBody}>{t('weekly.noPrebookingsBody', 'Browse dishes above and pre-book your favourites for the week.')}</Text>
              </View>
            ) : (
              myBookings
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((booking) => (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingRow}>
                      <View style={styles.flex}>
                        <Text style={styles.bookingDish}>{booking.dishName}</Text>
                        <Text style={styles.bookingMeta}>
                          {booking.kitchenName} · {dayLabel(t, booking.day)}
                        </Text>
                        <Text style={styles.bookingMeta}>{t('weekly.qty', { defaultValue: 'Qty: {{count}}', count: booking.quantity })}</Text>
                      </View>
                      <View style={styles.bookingRight}>
                        <Text style={styles.bookingAmount}>{money(booking.totalAmount)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] + '22', borderColor: STATUS_COLORS[booking.status] }]}>
                          <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[booking.status] }]}>
                            {statusLabel(t, booking.status)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {booking.status === 'pending' && (
                      <Pressable
                        style={styles.cancelBookingBtn}
                        onPress={() =>
                          Alert.alert(t('weekly.cancelPrebookTitle', 'Cancel pre-booking?'), t('weekly.cancelPrebookBody', 'Your reserved spot will be released.'), [
                            { text: t('weekly.keep', 'Keep'), style: 'cancel' },
                            { text: t('weekly.cancelBooking', 'Cancel Booking'), style: 'destructive', onPress: () => handleCancelBooking(booking.id, booking.orderId) },
                          ])
                        }
                      >
                        <Text style={styles.cancelBookingBtnText}>{t('weekly.cancelPrebooking', 'Cancel Pre-booking')}</Text>
                      </Pressable>
                    )}
                  </View>
                ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Pre-book Modal ──────────────────────────────────────────────────── */}
      <Modal visible={!!bookingTarget} animationType="slide" transparent onRequestClose={() => setBookingTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {bookingTarget && (
              <>
                <Text style={styles.modalTitle}>{t('weekly.prebook', 'Pre-book')}</Text>

                {/* Dish Summary */}
                <View style={styles.dishSummary}>
                  <View style={[styles.foodDot, { backgroundColor: bookingTarget.foodType === 'Veg' ? '#146b4b' : '#c94737' }]} />
                  <View style={styles.flex}>
                    <Text style={styles.dishSummaryName}>{bookingTarget.dishName}</Text>
                    <Text style={styles.dishSummaryMeta}>
                      {bookingTarget.kitchenName} · {bookingTarget.society} · {dayLabel(t, bookingTarget.day)}
                    </Text>
                  </View>
                  <Text style={styles.dishSummaryPrice}>{t('weekly.perPlate', { defaultValue: '{{price}} / plate', price: money(bookingTarget.price) })}</Text>
                </View>

                <View style={styles.availabilityRow}>
                  <Ionicons name="people-outline" size={14} color="#66736c" />
                  <Text style={styles.availabilityText}>{t('weekly.servingsLeft', { defaultValue: '{{count}} servings left', count: bookingTarget.remainingServings })}</Text>
                </View>

                {/* Quantity Stepper */}
                <Text style={styles.inputLabel}>{t('weekly.quantity', 'Quantity')}</Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{quantity}</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setQuantity((q) => Math.min(bookingTarget.remainingServings, q + 1))}
                    disabled={quantity >= bookingTarget.remainingServings}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </Pressable>
                </View>

                {/* Total */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('weekly.total', 'Total')}</Text>
                  <Text style={styles.totalValue}>{money(bookingTarget.price * quantity)}</Text>
                </View>

                <Text style={styles.noteText}>
                  {t('weekly.expectedDelivery', {
                    defaultValue: '🛵 Expected Delivery: {{time}}. Payment collected upon delivery.',
                    time: bookingTarget.mealType === 'Breakfast'
                      ? (bookingTarget.servingTime || t('weekly.breakfastTime', '8:00 AM – 8:30 AM'))
                      : bookingTarget.mealType === 'Lunch'
                      ? (bookingTarget.servingTime || t('weekly.lunchTime', '1:00 PM – 1:30 PM'))
                      : (bookingTarget.servingTime || t('weekly.dinnerTime', '7:30 PM – 8:00 PM')),
                  })}
                </Text>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <Pressable style={styles.cancelBtn} onPress={() => setBookingTarget(null)}>
                    <Text style={styles.cancelBtnText}>{t('weekly.cancel', 'Cancel')}</Text>
                  </Pressable>
                  <Pressable style={[styles.confirmBtn, bookingInProgress && { opacity: 0.6 }]} onPress={handlePreBook} disabled={bookingInProgress}>
                    <Ionicons name="bookmark" size={16} color="#fff" />
                    <Text style={styles.confirmBtnText}>
                      {bookingInProgress ? t('weekly.booking', 'Booking…') : t('weekly.prebookNow', 'Pre-book now')}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CALENDAR PICKER MODAL */}
      <Modal
        visible={showDatePickerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePickerModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('weekly.chooseDate', 'Choose Pre-Booking Date')}</Text>
            <Text style={styles.calendarModalSub}>
              {t('weekly.chooseDateSub', 'Select any upcoming date to view scheduled home-cooked specials.')}
            </Text>

            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <View style={styles.calendarGrid}>
                {calendarDates.map((item) => {
                  const isSelected = item.dateStr === selectedDateStr;
                  const count = weeklyDishes.filter((dish) => {
                    if (!dish.isActive) return false;
                    if (dish.date) return dish.date === item.dateStr;
                    return dish.day === item.dayKey && item.isCurrentWeek;
                  }).length;

                  return (
                    <Pressable
                      key={item.dateStr}
                      style={[styles.gridDateCard, isSelected && styles.gridDateCardActive]}
                      onPress={() => {
                        setSelectedDateStr(item.dateStr);
                        setSelectedDay(item.dayKey);
                        setShowDatePickerModal(false);
                      }}
                    >
                      <Text style={[styles.gridDayText, isSelected && styles.gridDayTextActive]}>
                        {item.isToday ? t('weekly.today', 'Today') : (item.isTomorrow ? t('weekly.tomorrow', 'Tomorrow') : dayShort(t, item.dayKey))}
                      </Text>
                      <Text style={[styles.gridNumText, isSelected && styles.gridNumTextActive]}>
                        {item.dateNum} {item.monthName}
                      </Text>
                      <View style={[styles.gridBadge, isSelected && styles.gridBadgeActive]}>
                        <Text style={[styles.gridBadgeText, isSelected && styles.gridBadgeTextActive]}>
                          {t('weekly.dishCount', { count })}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ marginTop: 16 }}>
              <Button
                label={t('weekly.closeCalendar', 'Close Calendar')}
                variant="secondary"
                onPress={() => setShowDatePickerModal(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Dish Detail Modal (Zomato-style Picture 1 sheet) */}
      <DishDetailModal
        visible={detailDish !== null}
        onClose={() => setDetailDish(null)}
        dish={detailDish}
        kitchen={detailDish ? { id: detailDish.chefId || detailDish.kitchenId || '', name: detailDish.kitchenName || '', society: detailDish.society } : undefined}
      />
      </ImageBackground>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatPill({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={spStyles.pill}>
      <Ionicons name={icon as any} size={13} color="rgba(255,255,255,0.8)" />
      <Text style={spStyles.value}>{value}</Text>
      <Text style={spStyles.label}>{label}</Text>
    </View>
  );
}
const spStyles = StyleSheet.create({
  pill: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  value: { color: '#fff', fontWeight: '900', fontSize: 16 },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700' },
});

function WeeklyDishCard({ dish, alreadyBooked, Colors, styles, onPreBook, onSelectDish }: {
  dish: WeeklyDish;
  alreadyBooked: boolean;
  Colors: any;
  styles: any;
  onPreBook: () => void;
  onSelectDish?: () => void;
}) {
  const { t } = useTranslation();
  const isSoldOut = dish.remainingServings === 0;
  const pct = Math.round(((dish.maxServings - dish.remainingServings) / dish.maxServings) * 100);

  return (
    <View style={[styles.dishCard, (isSoldOut || alreadyBooked) && { opacity: 0.7 }]}>
      <Pressable onPress={onSelectDish} accessibilityRole="button" accessibilityLabel={`View details for ${dish.dishName}`}>
        <View style={styles.dishCardTop}>
          <View style={[styles.foodBadge, { backgroundColor: dish.foodType === 'Veg' ? '#e1f2e9' : '#fde8e6' }]}>
            <View style={[styles.foodDot, { backgroundColor: dish.foodType === 'Veg' ? '#146b4b' : '#c94737' }]} />
            <Text style={[styles.foodBadgeText, { color: dish.foodType === 'Veg' ? '#146b4b' : '#c94737' }]}>
              {dish.foodType === 'Veg' ? t('weekly.veg', 'Veg') : t('weekly.nonVeg', 'Non-Veg')}
            </Text>
          </View>
          {alreadyBooked && (
            <View style={styles.bookedBadge}>
              <Ionicons name="bookmark" size={11} color="#1fa272" />
              <Text style={styles.bookedBadgeText}>{t('weekly.booked', 'Booked')}</Text>
            </View>
          )}
          {isSoldOut && (
            <View style={[styles.bookedBadge, { backgroundColor: '#fde8e6', borderColor: '#c94737' }]}>
              <Text style={[styles.bookedBadgeText, { color: '#c94737' }]}>{t('weekly.soldOut', 'Sold out')}</Text>
            </View>
          )}
        </View>

        <Text style={styles.dishCardName}>{dish.dishName}</Text>
        <Text style={styles.dishCardKitchen}>{dish.kitchenName} · {dish.society}</Text>

        <View style={styles.dishCardMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="cash-outline" size={13} color={Colors.muted} />
            <Text style={styles.metaChipText}>{money(dish.price)}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}>
            <Ionicons name="time-outline" size={13} color="#2E7D32" />
            <Text style={[styles.metaChipText, { color: '#2E7D32', fontWeight: '700' }]}>
              {dish.mealType === 'Breakfast'
                ? t('weekly.deliveryBreakfast', { defaultValue: '🌅 Delivery: {{time}}', time: dish.servingTime || t('weekly.breakfastTimeShort', '8:00-8:30 AM') })
                : dish.mealType === 'Lunch'
                ? t('weekly.deliveryLunch', { defaultValue: '☀️ Delivery: {{time}}', time: dish.servingTime || t('weekly.lunchTimeShort', '1:00-1:30 PM') })
                : t('weekly.deliveryDinner', { defaultValue: '🌙 Delivery: {{time}}', time: dish.servingTime || t('weekly.dinnerTimeShort', '7:30-8:00 PM') })}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={13} color={Colors.muted} />
            <Text style={styles.metaChipText}>{t('weekly.left', { defaultValue: '{{count}} left', count: dish.remainingServings })}</Text>
          </View>
        </View>
      </Pressable>

      {/* Demand bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: pct > 70 ? Colors.red : Colors.primary }]} />
      </View>
      <Text style={styles.demandText}>{t('weekly.prebookedPct', { defaultValue: '{{pct}}% pre-booked', pct })}</Text>

      {!isSoldOut && !alreadyBooked && (
        <Pressable style={styles.preBookBtn} onPress={onPreBook}>
          <Ionicons name="bookmark-outline" size={15} color="#fff" />
          <Text style={styles.preBookBtnText}>{t('weekly.prebook', 'Pre-book')}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  padded: { paddingHorizontal: 16, paddingTop: 16 },

  // Header
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, gap: 6 },
  headerEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19 },
  headerStats: { flexDirection: 'row', gap: 8, marginTop: 8 },

  // Segment
  segmentWrap: { paddingHorizontal: 16, paddingTop: 16 },
  segment: { flexDirection: 'row', backgroundColor: Colors.pillInactive, borderRadius: 10, padding: 3 },
  segBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  segBtnActive: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segBtnText: { fontSize: 13, fontWeight: '700', color: Colors.muted },
  segBtnTextActive: { color: Colors.dark },

  // Reminder Banner Card
  reminderBannerCard: {
    backgroundColor: isDark ? '#2D241E' : '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#F97316',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  reminderBannerLeft: {
    flex: 1,
  },
  reminderBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#FFEDD5' : '#C2410C',
    marginBottom: 4,
  },
  reminderBannerBody: {
    fontSize: 12,
    color: isDark ? '#FED7AA' : '#9A3412',
    lineHeight: 16,
  },
  reminderBannerBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reminderBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Calendar Strip
  calendarStripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarStripLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.muted,
    letterSpacing: 0.6,
  },
  calendarPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isDark ? 'rgba(224,83,67,0.15)' : '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  calendarPickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  dayRow: { gap: 8, paddingVertical: 4, marginBottom: 14 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    minWidth: 64,
  },
  dateChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  dateChipLabelActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  dateChipNum: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
    marginVertical: 2,
  },
  dateChipNumActive: {
    color: '#FFFFFF',
  },
  dateBadge: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  dateBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
  },
  dateBadgeTextActive: {
    color: '#FFFFFF',
  },
  selectedDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: Colors.dark },

  // Calendar Modal Grid
  calendarModalSub: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 4,
  },
  gridDateCard: {
    width: '30%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  gridDateCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  gridDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
  },
  gridDayTextActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  gridNumText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.dark,
    marginVertical: 4,
  },
  gridNumTextActive: {
    color: '#FFFFFF',
  },
  gridBadge: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
  },
  gridBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  emptyBody: { fontSize: 13, color: Colors.muted, textAlign: 'center', maxWidth: 260, lineHeight: 19 },

  // Dish Card
  dishCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, padding: 16, marginBottom: 14, gap: 8 },
  dishCardTop: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  foodBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  foodDot: { width: 8, height: 8, borderRadius: 4 },
  foodBadgeText: { fontSize: 11, fontWeight: '800' },
  bookedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, backgroundColor: '#e1f2e9', borderWidth: 1, borderColor: '#1fa272' },
  bookedBadgeText: { fontSize: 11, fontWeight: '800', color: '#1fa272' },
  dishCardName: { fontSize: 17, fontWeight: '900', color: Colors.dark },
  dishCardKitchen: { fontSize: 12, color: Colors.muted },
  dishCardMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaChipText: { fontSize: 12, fontWeight: '700', color: Colors.muted },
  progressBar: { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  demandText: { fontSize: 11, color: Colors.muted, fontWeight: '700' },
  preBookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, marginTop: 4 },
  preBookBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },

  // My Bookings
  bookingCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, padding: 16, marginBottom: 12, gap: 10 },
  bookingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  bookingRight: { alignItems: 'flex-end', gap: 4 },
  bookingDish: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  bookingMeta: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  bookingAmount: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  cancelBookingBtn: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelBookingBtnText: { fontSize: 13, fontWeight: '800', color: Colors.muted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.dark, marginBottom: 16 },
  dishSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bg, borderRadius: 12, padding: 14, marginBottom: 8 },
  dishSummaryName: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  dishSummaryMeta: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  dishSummaryPrice: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  availabilityText: { fontSize: 13, color: Colors.muted, fontWeight: '600' },
  inputLabel: { fontSize: 11, fontWeight: '900', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.pillInactive, borderRadius: 12, overflow: 'hidden', alignSelf: 'center', marginBottom: 20 },
  stepperBtn: { paddingHorizontal: 24, paddingVertical: 13 },
  stepperBtnText: { fontSize: 22, fontWeight: '900', color: Colors.dark },
  stepperValue: { fontSize: 22, fontWeight: '900', color: Colors.dark, minWidth: 50, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.muted },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.dark },
  noteText: { fontSize: 12, color: Colors.muted, lineHeight: 18, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '800', color: Colors.muted },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, shadowColor: Colors.primaryDeep, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  confirmBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
});
