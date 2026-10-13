import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/useThemeStore';
import type { WeeklyDish, DayKey } from '../../types';

const ALL_DAYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type DishCardProps = {
  dish: WeeklyDish;
  onEdit: (dish: WeeklyDish) => void;
  onDelete: (id: string) => void;
  onDuplicate: (dish: WeeklyDish, targetDay: DayKey) => void;
  onStatusChange?: (dish: WeeklyDish, newStatus: WeeklyDish['status']) => void;
};

function DishCard({ dish, onEdit, onDelete, onDuplicate, onStatusChange }: DishCardProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const dayShort = (d: string) => t(`weekly.dayShort.${d}`, d);

  const [showDupModal, setShowDupModal] = React.useState(false);
  const [showStatusModal, setShowStatusModal] = React.useState(false);

  const isVeg = dish.category === 'Veg';
  const otherDays = ALL_DAYS.filter((d) => d !== dish.day);

  const statusBadge: Record<WeeklyDish['status'], { label: string; bg: string; text: string } | null> = {
    active:   null,
    paused:   { label: t('dishCardWp.statusPaused', 'Paused'),     bg: Colors.goldBadge,  text: Colors.gold },
    sold_out: { label: t('dishCardWp.statusSoldOut', 'Sold Out'),  bg: `${Colors.red}22`,  text: Colors.red },
    hidden:   { label: t('dishCardWp.statusHidden', 'Hidden'),     bg: Colors.pillInactive, text: Colors.muted },
  };
  const badge = statusBadge[dish.status];

  function handleDuplicatePress() {
    if (Platform.OS === 'ios') {
      const { ActionSheetIOS } = require('react-native');
      const options = [...otherDays.map((d) => t('dishCardWp.dupTo', { defaultValue: 'Duplicate to {{day}}', day: dayShort(d) })), t('dishCardWp.cancel', 'Cancel')];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, title: t('dishCardWp.dupTitle', 'Duplicate dish to...') },
        (buttonIndex: number) => {
          if (buttonIndex < otherDays.length) onDuplicate(dish, otherDays[buttonIndex]);
        }
      );
    } else {
      setShowDupModal(true);
    }
  }

  function handleDeletePress() {
    const { Alert } = require('react-native');
    Alert.alert(t('dishCardWp.deleteTitle', 'Delete Dish'), t('dishCardWp.deleteBody', { defaultValue: 'Delete "{{name}}"?', name: dish.dishName }), [
      { text: t('dishCardWp.cancel', 'Cancel'), style: 'cancel' },
      { text: t('dishCardWp.delete', 'Delete'), style: 'destructive', onPress: () => onDelete(dish.id) },
    ]);
  }

  type StatusOption = { label: string; newStatus: WeeklyDish['status'] };
  function getStatusOptions(): StatusOption[] {
    switch (dish.status) {
      case 'active':   return [{ label: t('dishCardWp.optPause', 'Pause Dish'), newStatus: 'paused' }, { label: t('dishCardWp.optHide', 'Hide from Menu'), newStatus: 'hidden' }, { label: t('dishCardWp.optSoldOut', 'Mark Sold Out'), newStatus: 'sold_out' }];
      case 'paused':   return [{ label: t('dishCardWp.optResume', 'Resume Dish'), newStatus: 'active' }, { label: t('dishCardWp.optHide', 'Hide from Menu'), newStatus: 'hidden' }];
      case 'sold_out': return [{ label: t('dishCardWp.optReopen', 'Reopen Booking'), newStatus: 'active' }];
      case 'hidden':   return [{ label: t('dishCardWp.optUnhide', 'Unhide'), newStatus: 'active' }];
      default:         return [];
    }
  }

  function handleStatusMenuPress() {
    const options = getStatusOptions();
    if (Platform.OS === 'ios') {
      const { ActionSheetIOS } = require('react-native');
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options.map((o) => o.label), t('dishCardWp.cancel', 'Cancel')], cancelButtonIndex: options.length, title: t('dishCardWp.manageTitle', { defaultValue: 'Manage "{{name}}"', name: dish.dishName }) },
        (idx: number) => { if (idx < options.length) onStatusChange?.(dish, options[idx].newStatus); }
      );
    } else {
      setShowStatusModal(true);
    }
  }

  const statusOptions = getStatusOptions();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          <Text style={[styles.vegDot, { color: isVeg ? '#16A34A' : '#DC2626' }]}>●</Text>
          <Text style={styles.dishName} numberOfLines={1}>{dish.dishName}</Text>
        </View>
        <View style={styles.rightControls}>
          {badge && (
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          )}
          <View style={styles.mealCatBadges}>
            <View style={styles.badge}><Text style={styles.badgeText}>{t(`wPlanner.meal.${dish.mealType}`, dish.mealType)}</Text></View>
            <View style={[styles.badge, isVeg ? styles.vegBadge : styles.nonVegBadge]}>
              <Text style={[styles.badgeText, isVeg ? styles.vegBadgeText : styles.nonVegBadgeText]}>{isVeg ? t('wPlanner.filterVeg', 'Veg') : t('wPlanner.filterNonVeg', 'Non-Veg')}</Text>
            </View>
          </View>
          <Pressable style={styles.menuBtn} onPress={handleStatusMenuPress}>
            <Ionicons name="ellipsis-vertical" size={18} color={Colors.muted} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.metaLine}>
        <Text style={styles.price}>₹{dish.price}</Text>
        {'  ·  '}
        <Text>{t('dishCardWp.plates', { defaultValue: '{{n}} plates', n: dish.quantity })}</Text>
        {'  ·  '}
        <Text style={{ color: dish.remainingQuantity === 0 ? Colors.red : Colors.muted }}>
          {t('dishCardWp.left', { defaultValue: '{{n}} left', n: dish.remainingQuantity })}
        </Text>
      </Text>

      <View style={styles.progressTrack}>
        <View style={[styles.fillBar, {
          width: `${Math.min(100, Math.max(0, (dish.remainingQuantity / Math.max(1, dish.quantity)) * 100))}%`,
          backgroundColor: dish.remainingQuantity === 0 ? Colors.red : dish.remainingQuantity < 3 ? Colors.gold : '#16A34A',
        }]} />
      </View>

      <Text style={styles.closeTimeLine}>{t('dishCardWp.bookingCloses', { defaultValue: 'Booking closes {{time}}', time: dish.closeTime })}</Text>
      {dish.description ? <Text style={styles.descriptionLine} numberOfLines={2}>{dish.description}</Text> : null}

      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn} onPress={() => onEdit(dish)}>
          <Ionicons name="create-outline" size={15} color={Colors.muted} />
          <Text style={styles.actionText}>{t('dishCardWp.edit', 'Edit')}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleDuplicatePress}>
          <Ionicons name="copy-outline" size={15} color={Colors.muted} />
          <Text style={styles.actionText}>{t('dishCardWp.duplicate', 'Duplicate ▾')}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleDeletePress}>
          <Ionicons name="trash-outline" size={15} color={Colors.red} />
          <Text style={[styles.actionText, { color: Colors.red }]}>{t('dishCardWp.delete', 'Delete')}</Text>
        </Pressable>
      </View>

      {/* Android: Duplicate sheet */}
      <Modal visible={showDupModal} transparent animationType="fade" onRequestClose={() => setShowDupModal(false)}>
        <Pressable style={styles.dupOverlay} onPress={() => setShowDupModal(false)}>
          <View style={styles.dupSheet}>
            <Text style={styles.dupTitle}>{t('dishCardWp.dupTitle', 'Duplicate dish to...')}</Text>
            {otherDays.map((day) => (
              <Pressable key={day} style={styles.dupOption} onPress={() => { setShowDupModal(false); onDuplicate(dish, day); }}>
                <Text style={styles.dupOptionText}>{dayShort(day)}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.dupOption, styles.dupCancelOption]} onPress={() => setShowDupModal(false)}>
              <Text style={styles.dupCancelText}>{t('dishCardWp.cancel', 'Cancel')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Android: Status action sheet */}
      <Modal visible={showStatusModal} transparent animationType="fade" onRequestClose={() => setShowStatusModal(false)}>
        <Pressable style={styles.dupOverlay} onPress={() => setShowStatusModal(false)}>
          <View style={styles.dupSheet}>
            <Text style={styles.dupTitle}>{t('dishCardWp.manageTitle', { defaultValue: 'Manage "{{name}}"', name: dish.dishName })}</Text>
            {statusOptions.map((opt) => (
              <Pressable key={opt.label} style={styles.dupOption} onPress={() => { setShowStatusModal(false); onStatusChange?.(dish, opt.newStatus); }}>
                <Text style={[styles.dupOptionText, (opt.newStatus === 'sold_out' || opt.newStatus === 'hidden') && { color: Colors.red }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
            <Pressable style={[styles.dupOption, styles.dupCancelOption]} onPress={() => setShowStatusModal(false)}>
              <Text style={styles.dupCancelText}>{t('dishCardWp.cancel', 'Cancel')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default React.memo(DishCard);

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
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  vegDot:       { fontSize: 14 },
  dishName:     { fontSize: 15, fontWeight: '700', color: Colors.dark, flex: 1 },
  rightControls:{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  mealCatBadges:{ flexDirection: 'row', gap: 4 },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: Colors.pillInactive },
  vegBadge:     { backgroundColor: Colors.greenBadge },
  nonVegBadge:  { backgroundColor: `${Colors.red}22` },
  badgeText:    { fontSize: 10, fontWeight: '600', color: Colors.muted },
  vegBadgeText:    { color: '#16A34A' },
  nonVegBadgeText: { color: Colors.red },
  menuBtn:      { padding: 4 },
  metaLine:     { fontSize: 13, color: Colors.muted, marginBottom: 4 },
  price:        { fontWeight: '700', color: Colors.dark },
  closeTimeLine:{ fontSize: 12, color: Colors.muted, marginBottom: 4 },
  progressTrack: { height: 4, width: '100%', backgroundColor: Colors.border, borderRadius: 2, marginBottom: 8, overflow: 'hidden' },
  fillBar:       { height: '100%', borderRadius: 2 },
  descriptionLine: { fontSize: 12, color: Colors.muted, lineHeight: 17, marginBottom: 4 },
  actionRow:    { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 6, gap: 16 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText:   { fontSize: 12, fontWeight: '500', color: Colors.muted },
  dupOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  dupSheet:     { backgroundColor: Colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, paddingBottom: 30 },
  dupTitle:     { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 12, textAlign: 'center' },
  dupOption:    { paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  dupOptionText:   { fontSize: 15, fontWeight: '500', color: Colors.primary },
  dupCancelOption: { borderBottomWidth: 0, marginTop: 8 },
  dupCancelText:   { fontSize: 15, fontWeight: '600', color: Colors.muted },
});
