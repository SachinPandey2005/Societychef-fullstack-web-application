import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useNotificationStore } from '../store/useNotificationStore';
import type { DayKey } from '../types';

export type ConsumerDishItem = {
  id: string;
  chefId: string;
  chefName?: string;
  kitchenName: string;
  societyName: string;
  isSameSociety: boolean;
  /** Only weekly-scheduled dishes have a real day; live dishes have none. */
  day?: DayKey;
  dishName: string;
  category: 'Veg' | 'Non-Veg';
  mealType: string;
  price: number;
  discountPercent?: number;
  weeklyFree?: boolean;
  sample?: boolean;
  remainingQuantity: number;
  description?: string;
  closeTime: string;
  servingTime?: string;
  status: 'active' | 'paused' | 'sold_out' | 'hidden';
  isBookingOpen: boolean;
  /** Real kitchen rating (0 = no reviews yet), from GET /kitchens/stats. */
  kitchenRating?: number;
  /** Real completed-order count for this kitchen (0 = none yet). */
  kitchenOrders?: number;
};

type ConsumerDishCardProps = {
  item: ConsumerDishItem;
  onBook: (item: ConsumerDishItem) => void;
  onSelectDish?: (item: ConsumerDishItem) => void;
};

function ConsumerDishCard({ item, onBook, onSelectDish }: ConsumerDishCardProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [notified, setNotified] = useState(false);

  const isVeg = item.category === 'Veg';
  const canBook = item.isBookingOpen && item.remainingQuantity > 0 && item.status === 'active';
  const isSoldOut = item.status === 'sold_out' || item.remainingQuantity <= 0;

  const qtyColor =
    item.remainingQuantity === 0 ? Colors.red
    : item.remainingQuantity < 5 ? Colors.gold
    : Colors.muted;

  function handleNotifyMe() {
    setNotified(true);
    addNotification({
      type: 'free_dish',
      title: t('dishCard.restockSubscribedTitle', 'Restock Alert Subscribed 🔔'),
      body: t('dishCard.restockSubscribedBody', { defaultValue: "You'll get notified as soon as {{kitchen}} restocks {{dish}}!", kitchen: item.kitchenName, dish: item.dishName }),
      tone: 'blue',
      icon: 'notifications-outline',
      actionRoute: '/(consumer)/weekly',
    });
    Alert.alert(
      t('dishCard.restockSetTitle', 'Restock Alert Set! 🔔'),
      t('dishCard.restockSetBody', { defaultValue: 'We will notify you as soon as {{kitchen}} prepares a fresh batch of "{{dish}}".', kitchen: item.kitchenName, dish: item.dishName })
    );
  }

  const handleCardPress = () => {
    if (onSelectDish) {
      onSelectDish(item);
    } else {
      onBook(item);
    }
  };

  return (
    <View style={styles.card} accessibilityRole="none" accessibilityLabel={`${item.dishName} from ${item.kitchenName}`}>
      <Pressable onPress={handleCardPress}>
        {/* Row 1: name + meal type */}
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.vegDot, { color: isVeg ? '#16A34A' : '#DC2626' }]}>●</Text>
            <Text style={styles.dishName} numberOfLines={1}>{item.dishName}</Text>
          </View>
          <View style={styles.mealBadge}>
            <Text style={styles.mealBadgeText}>{item.mealType}</Text>
          </View>
        </View>

        {/* Row 2: Kitchen + society */}
        <View style={styles.kitchenRow}>
          <Pressable onPress={() => router.push(`/(consumer)/kitchen/${item.chefId}`)}>
            <Text style={[styles.kitchenName, { textDecorationLine: 'underline' }]}>{item.kitchenName}</Text>
          </Pressable>
          {item.isSameSociety && (
            <View style={styles.sameSocietyBadge}>
              <Text style={styles.sameSocietyText}>{t('dishCard.sameSociety', 'Same society')}</Text>
            </View>
          )}
          {!item.isSameSociety && (
            <Text style={styles.societyMuted}> · {item.societyName}</Text>
          )}
        </View>

        {/* Row 3: Price + qty */}
        <Text style={styles.metaLine}>
          <Text style={styles.price}>₹{item.price}</Text>
          {'  ·  '}
          <Text style={{ color: qtyColor, fontWeight: '600' }}>
            {item.remainingQuantity === 0 ? t('dishCard.soldOut', 'Sold Out') : t('dishCard.left', { defaultValue: '{{count}} left', count: item.remainingQuantity })}
          </Text>
        </Text>

        {/* Row 4: Close time */}
        <Text style={styles.closeTime}>{t('dishCard.bookingCloses', { defaultValue: 'Booking closes {{time}}', time: item.closeTime })}</Text>

        {/* Row 5: Description */}
        {item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}
      </Pressable>

      {/* Row 6: CTA */}
      <View style={styles.ctaRow}>
        {canBook ? (
          <Pressable style={styles.bookBtn} onPress={() => onBook(item)} accessibilityRole="button" accessibilityLabel={`Book ${item.dishName}`}>
            <Text style={styles.bookBtnText}>{t('dishCard.bookNow', 'Book Now')}</Text>
          </Pressable>
        ) : isSoldOut ? (
          <Pressable
            style={[styles.notifyBtn, notified && styles.notifyBtnActive]}
            onPress={handleNotifyMe}
            disabled={notified}
          >
            <Ionicons name={notified ? 'checkmark-circle' : 'notifications-outline'} size={15} color={notified ? '#16A34A' : Colors.primary} />
            <Text style={[styles.notifyBtnText, notified && { color: '#16A34A' }]}>
              {notified ? t('dishCard.restockAlertSet', 'Restock Alert Set') : t('dishCard.notifyWhenRestocked', 'Notify Me When Restocked')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.closedPill}>
            <Text style={styles.closedText}>{t('dishCard.bookingClosed', 'Booking Closed')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default React.memo(ConsumerDishCard);

const getStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 3 },
    }),
  },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  vegDot:   { fontSize: 14 },
  dishName: { fontSize: 15, fontWeight: '700', color: Colors.dark, flex: 1 },
  mealBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: Colors.pillInactive },
  mealBadgeText: { fontSize: 10, fontWeight: '600', color: Colors.muted },
  kitchenRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 },
  kitchenName:     { fontSize: 13, color: Colors.muted, fontWeight: '500' },
  sameSocietyBadge: { backgroundColor: Colors.greenBadge, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  sameSocietyText:  { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  societyMuted:     { fontSize: 12, color: Colors.muted },
  metaLine:  { fontSize: 13, color: Colors.muted, marginBottom: 4 },
  price:     { fontWeight: '700', color: Colors.dark },
  closeTime: { fontSize: 12, color: Colors.muted, marginBottom: 4 },
  description: { fontSize: 12, color: Colors.muted, lineHeight: 17, marginBottom: 6 },
  ctaRow: { marginTop: 8 },
  bookBtn:     { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  bookBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  closedPill:  { backgroundColor: Colors.pillInactive, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  closedText:  { fontSize: 13, fontWeight: '600', color: Colors.muted },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: `${Colors.primary}15`,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    borderRadius: 8,
    paddingVertical: 10,
  },
  notifyBtnActive: {
    backgroundColor: `${Colors.greenBadge}`,
    borderColor: '#16A34A',
  },
  notifyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
