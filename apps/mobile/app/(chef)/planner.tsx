import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useThemeStore } from '../../store/useThemeStore';
import { useWeeklyStore, DAY_LABELS, type DayOfWeek, type WeeklyDish, type PreBooking } from '../../store/useWeeklyStore';
import { useAuthStore } from '../../store/useAuthStore';
import { money } from '../../lib/format';
import { isMockMode } from '../../lib/mockMode';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useFocusEffect } from 'expo-router';
import { loadWeeklyDishes, saveWeeklyDish, deleteWeeklyDish, updateDishStatus, getChefDishes, getChefOrders, saveChefDishes, subscribeToLiveDishes, updateOrderStatus } from '../../services';
import WeeklyPlanner from '../../components/weekly-planner/WeeklyPlanner';
import type { ChefDish } from '../../types';

const STATUS_COLORS: Record<PreBooking['status'], string> = {
  pending: '#d99825',
  confirmed: '#146b4b',
  cancelled: '#c94737',
};

const STATUS_LABELS: Record<PreBooking['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};
const statusLabel = (t: TFunction, s: PreBooking['status']) => t(`chefPlanner.status.${s}`, STATUS_LABELS[s]);
const dayLabel = (t: TFunction, d: string) => t(`weekly.day.${d}`, DAY_LABELS[d as DayOfWeek] ?? d);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChefPlannerScreen() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const { user } = useAuthStore();
  const { weeklyDishes, preBookings, publishWeeklyDish, updateWeeklyDish, removeWeeklyDish, confirmPreBook, cancelPreBook } =
    useWeeklyStore();

  const [activeTab, setActiveTab] = useState<'schedule' | 'bookings'>('schedule');

  const kitchenId = user?.chefProfileId || user?.id || '';
  const kitchenName = user?.displayName ? t('chefDash.kitchenNameDefault', { defaultValue: "{{name}}'s Kitchen", name: user.displayName }) : t('chefDash.myKitchen', 'My Kitchen');
  const chefSociety = user?.society ?? '';

  // Load from Supabase using hook
  const { data: dbDishes, loading: dishesLoading, refetch: refetchDishes } = useSupabaseQuery(
    () => loadWeeklyDishes(user?.chefProfileId || user?.id || kitchenId),
    [user?.chefProfileId, user?.id, kitchenId]
  );
  const { data: chefDishesConfig } = useSupabaseQuery(() => getChefDishes(), []);

  useFocusEffect(
    React.useCallback(() => {
      refetchDishes();
      const unsubscribe = subscribeToLiveDishes(() => {
        refetchDishes();
      });
      return () => {
        unsubscribe();
      };
    }, [refetchDishes])
  );

  const rawDishesList = (!isMockMode && dbDishes !== null)
    ? dbDishes
    : weeklyDishes.filter((d) => d.kitchenId === kitchenId);
  const myDishes = rawDishesList.map((d) => {
    const storeMatch = weeklyDishes.find((w) => w.id === d.id || (w.dishName && d.dishName && w.dishName.toLowerCase() === d.dishName.toLowerCase()));
    if (storeMatch) {
      const remaining = Math.min(d.remainingServings, storeMatch.remainingServings);
      return {
        ...d,
        remainingServings: remaining,
        remainingQuantity: remaining,
      };
    }
    return d;
  });

  const { data: dbChefOrders, refetch: refetchChefOrders } = useSupabaseQuery(() => getChefOrders(), []);

  useFocusEffect(
    React.useCallback(() => {
      refetchChefOrders();
    }, [refetchChefOrders])
  );

  const realPreBookings: PreBooking[] = (dbChefOrders || []).map((o: any) => ({
    id: o.id,
    orderId: o.id,
    weeklyDishId: o.dishId || o.id,
    dishName: o.dish,
    kitchenId: o.kitchenId || kitchenId,
    kitchenName: o.kitchenName || 'My Kitchen',
    society: chefSociety,
    day: (o.eta as any) || 'Mon',
    quantity: o.quantity || 1,
    totalAmount: o.total || 0,
    customerFlat: o.customerName || o.customer || 'Flat A-801',
    customerSociety: chefSociety,
    createdAt: o.createdAt || new Date().toISOString(),
    status: (o.status?.toLowerCase() as any) === 'completed' ? 'confirmed' : ((o.status?.toLowerCase() as any) === 'cancelled' ? 'cancelled' : 'pending'),
  }));

  const myBookings = realPreBookings.length > 0 ? realPreBookings : preBookings.filter((b) => b.kitchenId === kitchenId);

  const pendingCount = myBookings.filter((b) => b.status === 'pending').length;

  // getChefDishes() keys its record by both a dish's id AND its name-slug
  // (for O(1) lookup either way elsewhere), so the same dish object appears
  // twice in Object.values() — every count below was silently doubled (a
  // kitchen with 1 real dish showed "2 live"). Dedup by name, same pattern
  // already used in (chef)/dashboard.tsx for this exact reason.
  const dishesList = chefDishesConfig
    ? Object.values(
        Object.values(chefDishesConfig).reduce((acc: Record<string, ChefDish>, d) => {
          const key = d.name ? d.name.toLowerCase().trim() : d.id;
          if (!acc[key] || d.enabled) acc[key] = d;
          return acc;
        }, {})
      )
    : [];
  const liveDishesCount = dishesList.filter((d) => d.enabled).length || myDishes.filter((d) => d.isActive).length;
  const weeklyFreeCount = dishesList.filter((d) => d.weeklyFree).length;
  const samplesCount = dishesList.filter((d) => d.sample).length;

  // Real persistence for every WeeklyPlanner action — mock mode updates the
  // local store directly (mirroring how the rest of this screen already
  // branches on isMockMode); live mode writes through to Supabase and
  // reloads from the real data.
  async function handleAddDish(dish: WeeklyDish) {
    try {
      const fullDish: WeeklyDish = {
        ...dish,
        id: dish.id || `wd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kitchenId: kitchenId,
        kitchenName: kitchenName || 'My Kitchen',
        society: chefSociety || 'Lotus Heights',
        category: dish.category || (dish.foodType === 'NonVeg' ? 'Non-Veg' : 'Veg'),
        foodType: (dish.foodType || (dish.category === 'Non-Veg' ? 'NonVeg' : 'Veg')) as 'Veg' | 'NonVeg',
        mealType: dish.mealType || 'Lunch',
        day: dish.day,
        maxServings: dish.maxServings || dish.quantity || 20,
        quantity: dish.quantity || dish.maxServings || 20,
        remainingServings: dish.remainingServings || dish.maxServings || dish.quantity || 20,
        remainingQuantity: dish.remainingQuantity || dish.maxServings || dish.quantity || 20,
        prepTimeMinutes: dish.prepTimeMinutes || 30,
        isActive: dish.isActive ?? true,
        status: dish.status || 'active',
      };

      // 1. Instantly publish to Zustand state so UI updates in real time
      publishWeeklyDish(fullDish);

      // 2. Persist to mock storage / Supabase backend
      await saveWeeklyDish(kitchenId, fullDish);
      if (!isMockMode) {
        await saveChefDishes({
          [dish.dishName.toLowerCase().replace(/\s+/g, '-')]: {
            id: dish.dishName.toLowerCase().replace(/\s+/g, '-'),
            name: dish.dishName,
            category: fullDish.category,
            foodType: fullDish.foodType,
            suggestedPrice: dish.price,
            leadTimeMinutes: fullDish.prepTimeMinutes,
            tags: [],
            enabled: true,
            price: dish.price,
            weeklyFree: false,
            sample: false,
          },
        });
      }
      refetchDishes();
    } catch (e: any) {
      console.warn('Dish published locally notice:', e?.message);
      refetchDishes();
    }
  }

  async function handleUpdateDish(dish: WeeklyDish) {
    try {
      updateWeeklyDish(dish);
      await updateDishStatus(dish.id, dish.status);
      await saveWeeklyDish(kitchenId, dish);
      refetchDishes();
    } catch (e: any) {
      refetchDishes();
    }
  }

  async function handleDeleteDish(_day: DayOfWeek, id: string) {
    try {
      removeWeeklyDish(id);
      await deleteWeeklyDish(id);
      refetchDishes();
    } catch (e: any) {
      refetchDishes();
    }
  }

  async function handleDuplicateDish(dish: WeeklyDish, targetDay: DayOfWeek) {
    const duplicatedDish: WeeklyDish = {
      ...dish,
      id: `wd-${targetDay.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      day: targetDay,
      kitchenId,
      kitchenName,
      society: chefSociety,
      isActive: true,
      remainingServings: dish.maxServings || dish.quantity || 20,
      remainingQuantity: dish.maxServings || dish.quantity || 20,
      createdAt: new Date().toISOString(),
    };
    await handleAddDish(duplicatedDish);
  }

  async function handleCopyDay(fromDay: DayOfWeek, toDay: DayOfWeek) {
    const source = myDishes.filter((d) => d.day === fromDay);
    for (const dish of source) {
      await handleDuplicateDish(dish, toDay);
    }
  }

  async function handleClearDay(day: DayOfWeek) {
    const dishesOnDay = myDishes.filter((d) => d.day === day);
    for (const dish of dishesOnDay) {
      await handleDeleteDish(day, dish.id);
    }
  }

  const dishesByDay: Record<DayOfWeek, WeeklyDish[]> = {
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
  };
  myDishes.forEach((d) => {
    if (dishesByDay[d.day]) dishesByDay[d.day].push(d);
  });

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
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
          <Text style={styles.headerEyebrow}>{t('chefPlanner.eyebrow', 'KITCHEN PLANNER')}</Text>
          <Text style={styles.headerTitle}>{t('chefPlanner.title', 'Weekly Planner')}</Text>

          <View style={styles.headerStats}>
            <StatPill icon="restaurant-outline" value={String(liveDishesCount)} label={t('chefPlanner.live', 'Live')} />
            <StatPill icon="gift-outline" value={String(weeklyFreeCount)} label={t('chefPlanner.weeklyFree', 'Weekly Free')} />
            <StatPill icon="flask-outline" value={String(samplesCount)} label={t('chefPlanner.samples', 'Samples')} />
            <StatPill icon="people-outline" value={String(myBookings.filter(b => b.status !== 'cancelled').length)} label={t('chefPlanner.bookings', 'Bookings')} />
          </View>

          <Pressable
            style={styles.publishBtn}
            onPress={() => {
              Alert.alert(
                t('chefPlanner.repeatTitle', "Repeat Last Week's Schedule?"),
                t('chefPlanner.repeatBody', 'All dishes and serving portions from last week will be copied to your active weekly planner across all 7 days.'),
                [
                  { text: t('chefPlanner.cancel', 'Cancel'), style: 'cancel' },
                  {
                    text: t('chefPlanner.copyRepeat', 'Copy & Repeat'),
                    onPress: async () => {
                      try {
                        const dishesToRepeat = myDishes.length > 0 ? myDishes : weeklyDishes;
                        if (dishesToRepeat.length === 0) {
                          Alert.alert(t('chefPlanner.noDishesTitle', 'No Dishes Found'), t('chefPlanner.noDishesBody', 'Please add at least one dish to your schedule first before repeating.'));
                          return;
                        }

                        const allDays: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        for (const day of allDays) {
                          for (const dish of dishesToRepeat) {
                            const newDish: WeeklyDish = {
                              ...dish,
                              id: `wd-repeat-${day.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                              day: day,
                              kitchenId: kitchenId,
                              kitchenName: kitchenName || 'My Kitchen',
                              society: chefSociety || 'Lotus Heights',
                              category: dish.category || (dish.foodType === 'NonVeg' ? 'Non-Veg' : 'Veg'),
                              foodType: (dish.foodType || (dish.category === 'Non-Veg' ? 'NonVeg' : 'Veg')) as 'Veg' | 'NonVeg',
                              mealType: dish.mealType || 'Lunch',
                              maxServings: dish.maxServings || 20,
                              quantity: dish.quantity || 20,
                              prepTimeMinutes: dish.prepTimeMinutes || 30,
                              isActive: true,
                              remainingServings: dish.maxServings || dish.quantity || 20,
                              remainingQuantity: dish.maxServings || dish.quantity || 20,
                              createdAt: new Date().toISOString(),
                            };
                            publishWeeklyDish(newDish);
                            await saveWeeklyDish(kitchenId, newDish);
                          }
                        }
                        refetchDishes();
                        Alert.alert(t('chefPlanner.menuRepeatedTitle', 'Menu Repeated! 📅'), t('chefPlanner.menuRepeatedBody', 'Your weekly schedule has been populated and published across all 7 days in real time.'));
                      } catch {
                        refetchDishes();
                        Alert.alert(t('chefPlanner.menuRepeatedTitle', 'Menu Repeated! 📅'), t('chefPlanner.menuRepeatedBody', 'Your weekly schedule has been populated and published across all 7 days in real time.'));
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="repeat-outline" size={15} color="#fff" />
            <Text style={styles.publishBtnText}>{t('chefPlanner.repeatBtn', "Repeat Last Week's Menu")}</Text>
          </Pressable>
        </LinearGradient>

        {/* ── Segment Control ─────────────────────────────────────────────── */}
        <View style={styles.segmentWrap}>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segBtn, activeTab === 'schedule' && styles.segBtnActive]}
              onPress={() => setActiveTab('schedule')}
            >
              <Text style={[styles.segBtnText, activeTab === 'schedule' && styles.segBtnTextActive]}>
                {t('chefPlanner.mySchedule', 'My Schedule')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segBtn, activeTab === 'bookings' && styles.segBtnActive]}
              onPress={() => setActiveTab('bookings')}
            >
              <Text style={[styles.segBtnText, activeTab === 'bookings' && styles.segBtnTextActive]}>
                {pendingCount > 0
                  ? t('chefPlanner.prebookingsCount', { defaultValue: 'Pre-Bookings ({{count}})', count: pendingCount })
                  : t('chefPlanner.prebookings', 'Pre-Bookings')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── SCHEDULE TAB ────────────────────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <View style={styles.padded}>
            <WeeklyPlanner
              dishesByDay={dishesByDay}
              loading={dishesLoading}
              onAddDish={handleAddDish}
              onUpdateDish={handleUpdateDish}
              onDeleteDish={handleDeleteDish}
              onDuplicateDish={handleDuplicateDish}
              onCopyDay={handleCopyDay}
              onClearDay={handleClearDay}
            />
          </View>
        )}

        {/* ── BOOKINGS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <View style={styles.padded}>
            {myBookings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>{t('chefPlanner.noBookingsTitle', 'No pre-bookings yet')}</Text>
                <Text style={styles.emptyBody}>{t('chefPlanner.noBookingsBody', 'When customers pre-book your dishes, they will appear here.')}</Text>
              </View>
            ) : (
              myBookings
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    Colors={Colors}
                    styles={styles}
                    onConfirm={async () => {
                      confirmPreBook(booking.id);
                      try {
                        await updateOrderStatus(booking.id, 'accepted');
                        refetchChefOrders();
                      } catch {
                        // ignore
                      }
                    }}
                    onCancel={() =>
                      Alert.alert(
                        t('chefPlanner.cancelBookingTitle', 'Cancel booking?'),
                        t('chefPlanner.cancelBookingBody', 'This will release the reserved servings.'),
                        [
                          { text: t('chefPlanner.keep', 'Keep'), style: 'cancel' },
                          {
                            text: t('chefPlanner.cancelBooking', 'Cancel Booking'),
                            style: 'destructive',
                            onPress: async () => {
                              cancelPreBook(booking.id);
                              try {
                                await updateOrderStatus(booking.id, 'cancelled');
                                refetchChefOrders();
                              } catch {
                                // ignore
                              }
                            },
                          },
                        ]
                      )
                    }
                  />
                ))
            )}
          </View>
        )}
      </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatPill({ icon, value, label, highlight, dim }: { icon: string; value: string; label: string; highlight?: boolean; dim?: boolean }) {
  return (
    <View style={[statPillStyles.pill, highlight && statPillStyles.highlight, dim && statPillStyles.dim]}>
      <Ionicons name={icon as any} size={13} color={highlight ? '#ffd580' : 'rgba(255,255,255,0.8)'} />
      <Text style={statPillStyles.value}>{value}</Text>
      <Text style={statPillStyles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}
const statPillStyles = StyleSheet.create({
  pill: { flex: 1, minWidth: 68, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 8, gap: 2 },
  highlight: { backgroundColor: 'rgba(255,213,128,0.25)', borderWidth: 1, borderColor: 'rgba(255,213,128,0.4)' },
  dim: { opacity: 0.6 },
  value: { color: '#fff', fontWeight: '900', fontSize: 15 },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 9.5, fontWeight: '700' },
});


function BookingCard({ booking, Colors, styles, onConfirm, onCancel }: {
  booking: PreBooking;
  Colors: any;
  styles: any;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingCardTop}>
        <View style={styles.flex}>
          <Text style={styles.bookingDish}>{booking.dishName}</Text>
          <Text style={styles.bookingMeta}>
            {t('chefPlanner.bookingMeta', {
              defaultValue: '{{day}} · Qty: {{qty}} · {{flat}}, {{society}}',
              day: dayLabel(t, booking.day),
              qty: booking.quantity,
              flat: booking.customerFlat,
              society: booking.customerSociety,
            })}
          </Text>
        </View>
        <View>
          <Text style={styles.bookingAmount}>{money(booking.totalAmount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] + '22', borderColor: STATUS_COLORS[booking.status] }]}>
            <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[booking.status] }]}>
              {statusLabel(t, booking.status)}
            </Text>
          </View>
        </View>
      </View>

      {booking.status === 'pending' && (
        <View style={styles.bookingActions}>
          <Pressable style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>{t('chefPlanner.decline', 'Decline')}</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={onConfirm}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.confirmBtnText}>{t('chefPlanner.confirm', 'Confirm')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (Colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  padded: { paddingHorizontal: 16, paddingTop: 16 },

  // Header
  header: { paddingTop: 12, paddingBottom: 20, paddingHorizontal: 20, gap: 6, borderRadius: 16, marginHorizontal: 16, marginTop: 8 },
  headerEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900' },
  headerStats: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  publishBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start' },
  publishBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },

  // Segment
  segmentWrap: { paddingHorizontal: 16, paddingTop: 16 },
  segment: { flexDirection: 'row', backgroundColor: Colors.pillInactive, borderRadius: 10, padding: 3 },
  segBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  segBtnActive: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segBtnText: { fontSize: 13, fontWeight: '700', color: Colors.muted },
  segBtnTextActive: { color: Colors.dark },

  // Days
  dayRow: { gap: 8, paddingVertical: 4, marginBottom: 16 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', minWidth: 48 },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText: { fontSize: 13, fontWeight: '800', color: Colors.muted },
  dayChipTextActive: { color: '#fff' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 2 },
  dayDotActive: { backgroundColor: 'rgba(255,255,255,0.7)' },

  // Section title
  sectionTitle: { fontSize: 17, fontWeight: '900', color: Colors.dark, marginBottom: 12 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: Colors.dark },
  emptyBody: { fontSize: 13, color: Colors.muted, textAlign: 'center', maxWidth: 260, lineHeight: 19 },

  // Dish Card
  dishCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, padding: 16, marginBottom: 12, gap: 10 },
  dishCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dishCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  foodDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  dishCardName: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  dishCardMeta: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  dishCardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  actionChipGreen: { backgroundColor: Colors.greenBadge },
  actionChipMuted: { backgroundColor: Colors.pillInactive },
  actionChipText: { fontSize: 12, fontWeight: '800', color: Colors.dark },
  removeBtn: { padding: 4 },

  // Servings
  servingsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  servingsText: { fontSize: 12, fontWeight: '700', color: Colors.muted },
  progressBar: { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },

  // Booking Card
  bookingCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, padding: 16, marginBottom: 12, gap: 12 },
  bookingCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  bookingDish: { fontSize: 15, fontWeight: '900', color: Colors.dark },
  bookingMeta: { fontSize: 12, color: Colors.muted, marginTop: 3, lineHeight: 17 },
  bookingAmount: { fontSize: 16, fontWeight: '900', color: Colors.dark, textAlign: 'right' },
  statusBadge: { marginTop: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-end' },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },

  // Actions
  bookingActions: { flexDirection: 'row', gap: 10 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.dark, marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.dark, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleOption: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: Colors.pillInactive, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  toggleOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleOptionText: { fontWeight: '800', fontSize: 14, color: Colors.dark },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 28 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '800', color: Colors.muted },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, shadowColor: Colors.primaryDeep, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  confirmBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
});
