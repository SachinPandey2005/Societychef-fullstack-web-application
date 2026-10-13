import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { money } from '../lib/format';
import type { PartyMenu, PartyPackage, PartyDish, PartyDishCategory } from '../types';
import { placePartyOrder } from '../services';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type PartyBuilderModalProps = {
  visible: boolean;
  onClose: () => void;
  kitchenId: string;
  kitchenName: string;
  partyMenu: PartyMenu | null;
};

export function PartyBuilderModal({
  visible,
  onClose,
  kitchenId,
  kitchenName,
  partyMenu,
}: PartyBuilderModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors, insets.bottom);
  const { addNotification } = useNotificationStore();
  const catLabel = (c: string) => t(`partyBuilder.cat.${c}`, c);

  const [step, setStep] = useState<'build' | 'review'>('build');

  // A failed/missing party-menu fetch used to fall back to a hardcoded fake
  // menu (fake packages, ~20 fake dishes) completely unrelated to the
  // kitchen actually being booked — a consumer could complete an entire
  // booking against it. The backend now independently re-validates and
  // recomputes pricing from the kitchen's real party_menus row regardless
  // (see party.controller.ts#createMyPartyOrder), so this could no longer
  // result in a forged charge, but it's still a confusing dead-end UX. Falls
  // back to an empty, real-shaped menu instead; the JSX below shows a clear
  // "menu unavailable" state when there's nothing real to book.
  const activeMenu = partyMenu || {
    kitchenId,
    isEnabled: false,
    minGuests: 1,
    advanceNoticeHours: 48,
    packages: [] as PartyPackage[],
    dishes: [] as PartyDish[],
  };
  const hasRealMenu = !!partyMenu && activeMenu.packages.length > 0;

  const [selectedPackId, setSelectedPackId] = useState<string>(
    activeMenu.packages.find((p) => p.isPopular)?.id || activeMenu.packages[0]?.id || 'jalsa'
  );
  const [guests, setGuests] = useState<number>(activeMenu.minGuests || 8);
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(2); // 2 = In 2 Days (min 48h)
  const [timeHour, setTimeHour] = useState<number>(8);
  const [timeMinute, setTimeMinute] = useState<number>(30);
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('PM');
  const [dietFilter, setDietFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTimeSlot = `${timeHour}:${timeMinute.toString().padStart(2, '0')} ${timePeriod}`;

  function applyQuickTimeSlot(slotStr: string) {
    const match = slotStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      setTimeHour(parseInt(match[1], 10));
      setTimeMinute(parseInt(match[2], 10));
      setTimePeriod(match[3].toUpperCase() as 'AM' | 'PM');
    }
  }

  const selectedPack = activeMenu.packages.find((p) => p.id === selectedPackId) || activeMenu.packages[0];

  // Default dish selection when pack changes
  useEffect(() => {
    if (!selectedPack) return;
    const initialDishes: string[] = [];
    const categories: PartyDishCategory[] = ['Starters', 'Mains', 'Breads', 'Sweets'];

    categories.forEach((cat) => {
      const capKey = cat.toLowerCase() as keyof typeof selectedPack.categoryCaps;
      const maxCap = selectedPack.categoryCaps[capKey] || 1;
      const catDishes = activeMenu.dishes.filter((d) => d.category === cat && d.isAvailable);
      catDishes.slice(0, maxCap).forEach((d) => initialDishes.push(d.id));
    });

    setSelectedDishIds(initialDishes);
  }, [selectedPackId]);

  // Reset step on modal open/close
  useEffect(() => {
    if (visible) setStep('build');
  }, [visible]);

  function toggleDish(dish: PartyDish) {
    const isSelected = selectedDishIds.includes(dish.id);
    const catKey = dish.category.toLowerCase() as keyof typeof selectedPack.categoryCaps;
    const maxCap = selectedPack.categoryCaps[catKey] || 1;
    const currentCatCount = selectedDishIds.filter(
      (id) => activeMenu.dishes.find((d) => d.id === id)?.category === dish.category
    ).length;

    if (isSelected) {
      setSelectedDishIds((prev) => prev.filter((id) => id !== dish.id));
    } else {
      if (currentCatCount >= maxCap) {
        Alert.alert(t('partyBuilder.catLimitTitle', 'Category limit reached'), t('partyBuilder.catLimitBody', { defaultValue: 'You can select up to {{max}} {{category}} for the {{pack}} pack.', max: maxCap, category: catLabel(dish.category), pack: selectedPack.name }));
        return;
      }
      setSelectedDishIds((prev) => [...prev, dish.id]);
    }
  }

  const [isKidsMenuEnabled, setIsKidsMenuEnabled] = useState<boolean>(false);
  const [kidsCount, setKidsCount] = useState<number>(2);
  const [selectedKidsDishIds, setSelectedKidsDishIds] = useState<string[]>(['k1']);

  const kidsMenuPricePerHead = activeMenu.kidsMenuPricePerHead || 120;
  const defaultKidsDishes: PartyDish[] = activeMenu.kidsDishes || [
    { id: 'k1', name: 'Mini veg puffs', category: 'Kids', isAvailable: true, isVeg: true },
    { id: 'k2', name: 'Cheese pasta', category: 'Kids', isAvailable: true, isVeg: true },
    { id: 'k3', name: 'Chocolate mousse cup', category: 'Kids', isAvailable: true, isVeg: true },
  ];

  // Calculate pricing
  const basePricePerHead = selectedPack ? selectedPack.pricePerHead : 280;
  const selectedDishItems = activeMenu.dishes.filter((d) => selectedDishIds.includes(d.id));
  const extraPerHead = selectedDishItems.reduce((acc, d) => acc + (d.extraChargePerHead || 0), 0);
  const totalPerHead = basePricePerHead + extraPerHead;
  const baseTotalAmount = basePricePerHead * guests;
  const extraTotalAmount = extraPerHead * guests;

  const kidsTotalAmount = isKidsMenuEnabled ? kidsCount * kidsMenuPricePerHead : 0;
  const totalAmount = (totalPerHead * guests) + kidsTotalAmount;

  // Custom Booking Date & Time Calculation (48h min)
  const bookingDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDateOffset);
    let h = timeHour;
    if (timePeriod === 'PM' && h < 12) h += 12;
    if (timePeriod === 'AM' && h === 12) h = 0;
    d.setHours(h, timeMinute, 0, 0);
    return d;
  })();

  const noticeHours = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);

  const formattedDateStr = bookingDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const availableDates = [2, 3, 4, 5, 6, 7, 8].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      label: offset === 2 ? t('partyBuilder.in2Days', 'In 2 Days') : d.toLocaleString('en-US', { weekday: 'short' }),
      dateNum: d.toLocaleString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const availableTimeSlots = ['1:00 PM', '2:30 PM', '7:00 PM', '8:30 PM', '9:30 PM'];

  function handleGoToReview() {
    if (guests < activeMenu.minGuests) {
      Alert.alert(t('partyBuilder.guestMinTitle', 'Guest minimum'), t('partyBuilder.guestMinBody', { defaultValue: 'Minimum guests required for party mode is {{count}}.', count: activeMenu.minGuests }));
      return;
    }
    if (noticeHours < 47.5) {
      Alert.alert(t('partyBuilder.advanceNoticeTitle', 'Advance notice required'), t('partyBuilder.advanceNoticeBody', 'Party pre-bookings require at least 48 hours advance notice.'));
      return;
    }
    setStep('review');
  }

  async function handlePreBook() {
    setIsSubmitting(true);
    try {
      await placePartyOrder({
        kitchenId,
        kitchenName,
        packId: selectedPack.id,
        packName: selectedPack.name,
        basePricePerHead,
        totalPerHead,
        guestCount: guests,
        selectedDishes: selectedDishItems.map((d) => ({
          dishId: d.id,
          name: d.name,
          category: d.category,
          extraChargePerHead: d.extraChargePerHead,
        })),
        bookingDate: bookingDate.toISOString(),
        totalAmount,
        kidsCount: isKidsMenuEnabled ? kidsCount : 0,
      });

      addNotification({
        type: 'order_update',
        title: t('partyBuilder.notifTitle', '🎉 Party Pre-booking Placed!'),
        body: t('partyBuilder.notifBody', { defaultValue: 'Your pre-booking for {{guests}} guests on {{date}} is sent to {{kitchen}} for acceptance.', guests, date: formattedDateStr, kitchen: kitchenName }),
        icon: 'time-outline',
        tone: 'gold',
        actionRoute: '/(consumer)/orders',
      });

      onClose();
      router.push('/(consumer)/orders');
    } catch (err: any) {
      Alert.alert(t('partyBuilder.errorTitle', 'Error'), err.message || t('partyBuilder.prebookFailed', 'Failed to place party pre-booking.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const categories: PartyDishCategory[] = ['Starters', 'Mains', 'Breads', 'Sweets'];

  if (!hasRealMenu) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
            <Ionicons name="restaurant-outline" size={40} color={Colors.muted} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.dark, marginTop: 12, textAlign: 'center' }}>
              {t('partyBuilder.menuUnavailableTitle', 'Party menu unavailable')}
            </Text>
            <Text style={{ fontSize: 13, color: Colors.muted, marginTop: 6, textAlign: 'center' }}>
              {t('partyBuilder.menuUnavailableBody', 'This kitchen\'s party menu could not be loaded right now. Please try again shortly.')}
            </Text>
            <Pressable style={[styles.backBtn, { marginTop: 20 }]} onPress={onClose}>
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>{t('partyBuilder.close', 'Close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            {step === 'review' ? (
              <Pressable style={styles.backBtn} onPress={() => setStep('build')}>
                <Ionicons name="arrow-back" size={20} color={Colors.dark} />
              </Pressable>
            ) : null}
            <View style={{ flex: 1, marginLeft: step === 'review' ? 8 : 0 }}>
              <Text style={styles.title}>{step === 'review' ? t('partyBuilder.reviewTitle', 'Review & Bill') : t('partyBuilder.partyMode', 'Party Mode')}</Text>
              <Text style={styles.subtitle}>{t('partyBuilder.gatheringBy', { defaultValue: 'Gathering pre-orders by {{kitchen}}', kitchen: kitchenName })}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.dark} />
            </Pressable>
          </View>

          {step === 'build' ? (
            /* Step 1: Customize Menu & Pack */
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* 1. Choose your pack */}
              <Text style={styles.sectionHeading}>{t('partyBuilder.choosePack', 'Choose your pack')}</Text>
              <View style={styles.packGrid}>
                {activeMenu.packages.map((pack) => {
                  const isSelected = pack.id === selectedPackId;
                  const isPopular = pack.isPopular;
                  return (
                    <Pressable
                      key={pack.id}
                      style={[
                        styles.packCard,
                        isSelected ? styles.packCardSelected : styles.packCardUnselected,
                      ]}
                      onPress={() => setSelectedPackId(pack.id)}
                    >
                      {isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>{t('partyBuilder.popular', 'POPULAR')}</Text>
                        </View>
                      )}
                      <Text style={[styles.packTag, isSelected && styles.textWhite]}>{pack.name}</Text>
                      <Text style={[styles.packPrice, isSelected && styles.textWhite]}>
                        ₹{pack.pricePerHead}<Text style={styles.packPriceUnit}>{t('partyBuilder.perHeadUnit', '/head')}</Text>
                      </Text>
                      <View style={styles.packDetails}>
                        <Text style={[styles.packDetailText, isSelected && styles.textWhite]}>
                          {t('partyBuilder.packStarters', { defaultValue: '• {{count}} starters', count: pack.categoryCaps.starters })}
                        </Text>
                        <Text style={[styles.packDetailText, isSelected && styles.textWhite]}>
                          {t('partyBuilder.packMains', { defaultValue: '• {{count}} main course', count: pack.categoryCaps.mains })}
                        </Text>
                        <Text style={[styles.packDetailText, isSelected && styles.textWhite]}>
                          {t('partyBuilder.packBreadRice', '• Bread, rice')}
                        </Text>
                        <Text style={[styles.packDetailText, isSelected && styles.textWhite]}>
                          {t('partyBuilder.packSweets', { count: pack.categoryCaps.sweets })}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* 2. Guests Counter */}
              <View style={styles.guestsCard}>
                <View style={styles.guestsLeft}>
                  <Ionicons name="people-outline" size={22} color={Colors.dark} />
                  <View>
                    <Text style={styles.guestsLabel}>{t('partyBuilder.guests', 'Guests')}</Text>
                    <Text style={styles.guestsSubLabel}>{t('partyBuilder.minGuests', { defaultValue: '(Min {{count}} guests)', count: activeMenu.minGuests })}</Text>
                  </View>
                </View>
                <View style={styles.counterRow}>
                  <Pressable
                    style={[styles.counterBtn, guests <= activeMenu.minGuests && styles.counterBtnDisabled]}
                    onPress={() => setGuests((g) => Math.max(activeMenu.minGuests, g - 1))}
                    disabled={guests <= activeMenu.minGuests}
                  >
                    <Ionicons name="remove" size={18} color={guests <= activeMenu.minGuests ? Colors.muted : Colors.dark} />
                  </Pressable>
                  <Text style={styles.counterValue}>{guests}</Text>
                  <Pressable
                    style={[styles.counterBtn, styles.counterBtnAdd]}
                    onPress={() => setGuests((g) => g + 1)}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              {/* 3. Event Pre-booking Date & Preferred Time */}
              <View style={styles.dateCard}>
                <View style={styles.dateHeader}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                  <Text style={styles.dateTitle}>{t('partyBuilder.selectDateTime', 'Select Pre-book Date & Time')}</Text>
                </View>

                <View style={styles.selectedDateBadge}>
                  <Text style={styles.selectedDateText}>{formattedDateStr}</Text>
                  <Text style={styles.noticeSubText}>{t('partyBuilder.min48h', 'Min 48h advance notice')}</Text>
                </View>

                {/* Date Picker Carousel */}
                <Text style={styles.subSectionTitle}>{t('partyBuilder.selectEventDate', 'Select Event Date')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateCarousel}>
                  {availableDates.map((item) => {
                    const isSelected = item.offset === selectedDateOffset;
                    return (
                      <Pressable
                        key={item.offset}
                        style={[styles.dateCardItem, isSelected && styles.dateCardItemSelected]}
                        onPress={() => setSelectedDateOffset(item.offset)}
                      >
                        <Text style={[styles.dateCardLabel, isSelected && styles.textWhite]}>{item.label}</Text>
                        <Text style={[styles.dateCardNum, isSelected && styles.textWhite]}>{item.dateNum}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Preferred Meal Time Spinner with Increase/Decrease Arrows */}
                <Text style={styles.subSectionTitle}>{t('partyBuilder.selectMealTime', 'Select Event Meal Time')}</Text>

                <View style={styles.timePickerContainer}>
                  {/* Hours Column */}
                  <View style={styles.spinnerColumn}>
                    <Pressable
                      style={styles.spinnerArrowBtn}
                      onPress={() => setTimeHour((h) => (h === 12 ? 1 : h + 1))}
                    >
                      <Ionicons name="chevron-up" size={18} color="#2C1B14" />
                    </Pressable>
                    <View style={styles.spinnerValueBox}>
                      <Text style={styles.spinnerValueText}>{timeHour.toString().padStart(2, '0')}</Text>
                      <Text style={styles.spinnerSubText}>{t('partyBuilder.hr', 'HR')}</Text>
                    </View>
                    <Pressable
                      style={styles.spinnerArrowBtn}
                      onPress={() => setTimeHour((h) => (h === 1 ? 12 : h - 1))}
                    >
                      <Ionicons name="chevron-down" size={18} color="#2C1B14" />
                    </Pressable>
                  </View>

                  <Text style={styles.spinnerColon}>:</Text>

                  {/* Minutes Column */}
                  <View style={styles.spinnerColumn}>
                    <Pressable
                      style={styles.spinnerArrowBtn}
                      onPress={() => setTimeMinute((m) => (m + 15) % 60)}
                    >
                      <Ionicons name="chevron-up" size={18} color="#2C1B14" />
                    </Pressable>
                    <View style={styles.spinnerValueBox}>
                      <Text style={styles.spinnerValueText}>{timeMinute.toString().padStart(2, '0')}</Text>
                      <Text style={styles.spinnerSubText}>{t('partyBuilder.min', 'MIN')}</Text>
                    </View>
                    <Pressable
                      style={styles.spinnerArrowBtn}
                      onPress={() => setTimeMinute((m) => (m - 15 + 60) % 60)}
                    >
                      <Ionicons name="chevron-down" size={18} color="#2C1B14" />
                    </Pressable>
                  </View>

                  {/* AM / PM Toggle Pill */}
                  <View style={styles.ampmToggleBox}>
                    <Pressable
                      style={[styles.ampmBtn, timePeriod === 'AM' && styles.ampmBtnActive]}
                      onPress={() => setTimePeriod('AM')}
                    >
                      <Text style={[styles.ampmBtnText, timePeriod === 'AM' && styles.ampmBtnTextActive]}>{t('partyBuilder.am', 'AM')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.ampmBtn, timePeriod === 'PM' && styles.ampmBtnActive]}
                      onPress={() => setTimePeriod('PM')}
                    >
                      <Text style={[styles.ampmBtnText, timePeriod === 'PM' && styles.ampmBtnTextActive]}>{t('partyBuilder.pm', 'PM')}</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Quick suggestion chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeSlotRow}>
                  {availableTimeSlots.map((slot) => {
                    const isSelected = slot === selectedTimeSlot;
                    return (
                      <Pressable
                        key={slot}
                        style={[styles.timeSlotPill, isSelected && styles.timeSlotPillActive]}
                        onPress={() => applyQuickTimeSlot(slot)}
                      >
                        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextActive]}>
                          {slot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 4. Pick dishes by category */}
              <View style={styles.dishesHeaderRow}>
                <Text style={styles.sectionHeading}>
                  {t('partyBuilder.packPickDishes', { defaultValue: '{{pack}} pack · pick your dishes', pack: selectedPack.name.toLowerCase() })}
                </Text>
              </View>

              {/* Veg / Non-Veg filter toggle */}
              <View style={styles.dietFilterRow}>
                <Pressable
                  style={[styles.dietPill, dietFilter === 'All' && styles.dietPillActive]}
                  onPress={() => setDietFilter('All')}
                >
                  <Text style={[styles.dietPillText, dietFilter === 'All' && styles.dietPillTextActive]}>{t('partyBuilder.allItems', 'All Items')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.dietPill, dietFilter === 'Veg' && styles.dietPillVegActive]}
                  onPress={() => setDietFilter('Veg')}
                >
                  <View style={styles.vegBadgeIcon}>
                    <View style={styles.vegDotInner} />
                  </View>
                  <Text style={[styles.dietPillText, dietFilter === 'Veg' && styles.dietPillVegTextActive]}>{t('partyBuilder.vegOnly', 'Veg Only')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.dietPill, dietFilter === 'Non-Veg' && styles.dietPillNonVegActive]}
                  onPress={() => setDietFilter('Non-Veg')}
                >
                  <View style={styles.nonVegBadgeIcon}>
                    <View style={styles.nonVegDotInner} />
                  </View>
                  <Text style={[styles.dietPillText, dietFilter === 'Non-Veg' && styles.dietPillNonVegTextActive]}>{t('partyBuilder.nonVegOnly', 'Non-Veg Only')}</Text>
                </Pressable>
              </View>

              {categories.map((cat) => {
                const capKey = cat.toLowerCase() as keyof typeof selectedPack.categoryCaps;
                const maxCap = selectedPack.categoryCaps[capKey] || 1;
                const catDishes = activeMenu.dishes.filter((d) => d.category === cat && d.isAvailable);
                const filteredCatDishes = catDishes.filter((d) =>
                  dietFilter === 'All'
                    ? true
                    : dietFilter === 'Veg'
                      ? d.isVeg !== false
                      : d.isVeg === false
                );
                const selectedCount = selectedDishIds.filter((id) =>
                  catDishes.some((d) => d.id === id)
                ).length;

                if (filteredCatDishes.length === 0) return null;

                return (
                  <View key={cat} style={styles.categoryBlock}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>{catLabel(cat)}</Text>
                      <View style={styles.capBadge}>
                        <Text style={styles.capBadgeText}>
                          {t('partyBuilder.pickSelected', { defaultValue: 'Pick {{max}} · {{count}} selected', max: maxCap, count: selectedCount })}
                        </Text>
                      </View>
                    </View>

                    {filteredCatDishes.map((dish) => {
                      const isSelected = selectedDishIds.includes(dish.id);
                      const isVegDish = dish.isVeg !== false;
                      return (
                        <Pressable
                          key={dish.id}
                          style={[styles.dishItem, isSelected && styles.dishItemSelected]}
                          onPress={() => toggleDish(dish)}
                        >
                          <View style={styles.dishNameRow}>
                            <View style={isVegDish ? styles.vegBadgeIcon : styles.nonVegBadgeIcon}>
                              <View style={isVegDish ? styles.vegDotInner : styles.nonVegDotInner} />
                            </View>
                            <Text style={styles.dishName}>
                              {dish.name}
                              {dish.extraChargePerHead ? (
                                <Text style={styles.extraCharge}>{t('partyBuilder.extraPerHead', { defaultValue: ' +₹{{amount}}/head', amount: dish.extraChargePerHead })}</Text>
                              ) : null}
                            </Text>
                          </View>
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                            color={isSelected ? Colors.dark : Colors.muted}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}

              {/* 5. Kids menu optional section */}
              <View style={{ backgroundColor: '#FAF6F0', borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#E8E1D9', marginVertical: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="cart-outline" size={20} color="#D97724" />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.dark }}>{t('partyBuilder.kidsMenuOptional', 'Kids menu · optional')}</Text>
                  </View>
                  <Pressable onPress={() => setIsKidsMenuEnabled((prev) => !prev)}>
                    <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: isKidsMenuEnabled ? Colors.primary : '#E5DFD7', padding: 2, justifyContent: 'center' }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', alignSelf: isKidsMenuEnabled ? 'flex-end' : 'flex-start' }} />
                    </View>
                  </Pressable>
                </View>
                <Text style={{ fontSize: 12, color: Colors.muted, marginBottom: 12 }}>{t('partyBuilder.kidsMenuSub', { defaultValue: 'Lighter portions, mild spice · ₹{{price}}/head', price: kidsMenuPricePerHead })}</Text>

                {isKidsMenuEnabled && (
                  <View style={{ marginTop: 4 }}>
                    {defaultKidsDishes.map((kDish) => {
                      const isSelected = selectedKidsDishIds.includes(kDish.id);
                      return (
                        <Pressable
                          key={kDish.id}
                          style={{
                            backgroundColor: '#FFF',
                            borderRadius: 12,
                            padding: 12,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: isSelected ? Colors.dark : '#E8E1D9',
                          }}
                          onPress={() => {
                            if (isSelected) {
                              if (selectedKidsDishIds.length > 1) {
                                setSelectedKidsDishIds((prev) => prev.filter((id) => id !== kDish.id));
                              } else {
                                Alert.alert(t('partyBuilder.selectionRequiredTitle', 'Selection required'), t('partyBuilder.selectionRequiredBody', 'Please keep at least 1 kids dish selected.'));
                              }
                            } else {
                              setSelectedKidsDishIds((prev) => [...prev, kDish.id]);
                            }
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.dark }}>{kDish.name}</Text>
                          <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isSelected ? Colors.dark : Colors.muted}
                          />
                        </Pressable>
                      );
                    })}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E8E1D9' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="people-outline" size={16} color={Colors.muted} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.dark }}>{t('partyBuilder.numberOfKids', 'Number of kids')}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <Pressable
                          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E8E1D9', alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => setKidsCount((c) => Math.max(1, c - 1))}
                        >
                          <Ionicons name="remove" size={16} color={Colors.dark} />
                        </Pressable>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.dark }}>{kidsCount}</Text>
                        <Pressable
                          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => setKidsCount((c) => c + 1)}
                        >
                          <Ionicons name="add" size={16} color="#FFF" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            /* Step 2: Order Review & Detailed Bill Summary */
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Event Overview Card */}
              <View style={styles.reviewOverviewCard}>
                <View style={styles.reviewOverviewHeader}>
                  <Ionicons name="sparkles-outline" size={20} color="#D97724" />
                  <Text style={styles.reviewOverviewTitle}>{t('partyBuilder.partyPackLabel', { defaultValue: '{{pack}} PARTY PACK', pack: selectedPack.name })}</Text>
                  <View style={styles.guestsBadge}>
                    <Text style={styles.guestsBadgeText}>{t('partyBuilder.guestsCount', { defaultValue: '{{count}} Guests', count: guests })}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.reviewRow}>
                  <Ionicons name="restaurant-outline" size={16} color="#8A7A70" />
                  <Text style={styles.reviewRowLabel}>{t('partyBuilder.kitchenLabel', 'Kitchen:')}</Text>
                  <Text style={styles.reviewRowValue}>{kitchenName}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Ionicons name="calendar-outline" size={16} color="#8A7A70" />
                  <Text style={styles.reviewRowLabel}>{t('partyBuilder.scheduledDateLabel', 'Scheduled Date:')}</Text>
                  <Text style={styles.reviewRowValue}>{formattedDateStr}</Text>
                </View>
              </View>

              {/* Selected Dishes Summary */}
              <Text style={styles.sectionHeading}>{t('partyBuilder.selectedMenu', { defaultValue: 'Selected Menu ({{count}} items)', count: selectedDishItems.length })}</Text>
              <View style={styles.selectedMenuCard}>
                {categories.map((cat) => {
                  const catItems = selectedDishItems.filter((d) => d.category === cat);
                  if (catItems.length === 0) return null;
                  return (
                    <View key={cat} style={{ marginBottom: 10 }}>
                      <Text style={styles.reviewCatTitle}>{catLabel(cat)}</Text>
                      {catItems.map((item) => (
                        <View key={item.id} style={styles.reviewDishRow}>
                          <Text style={styles.reviewDishBullet}>•</Text>
                          <Text style={styles.reviewDishName}>{item.name}</Text>
                          {item.extraChargePerHead ? (
                            <Text style={styles.reviewDishExtra}>{t('partyBuilder.extraPerHead', { defaultValue: ' +₹{{amount}}/head', amount: item.extraChargePerHead }).trim()}</Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  );
                })}
                {isKidsMenuEnabled && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={styles.reviewCatTitle}>{t('partyBuilder.kidsMenuCount', { defaultValue: 'Kids Menu ({{count}} Kids)', count: kidsCount })}</Text>
                    {defaultKidsDishes.filter((k) => selectedKidsDishIds.includes(k.id)).map((item) => (
                      <View key={item.id} style={styles.reviewDishRow}>
                        <Text style={styles.reviewDishBullet}>•</Text>
                        <Text style={styles.reviewDishName}>{item.name}</Text>
                        <Text style={styles.reviewDishExtra}>{t('partyBuilder.mildSpice', 'Mild Spice')}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Detailed Bill Summary Section */}
              <Text style={styles.sectionHeading}>{t('partyBuilder.billDetails', 'Bill Details')}</Text>
              <View style={styles.billBox}>
                <View style={styles.billLine}>
                  <Text style={styles.billLineLabel}>{t('partyBuilder.packLine', { defaultValue: '{{pack}} Pack ({{guests}} × ₹{{price}})', pack: selectedPack.name, guests, price: basePricePerHead })}</Text>
                  <Text style={styles.billLineValue}>₹{baseTotalAmount}</Text>
                </View>
                {extraPerHead > 0 && (
                  <View style={styles.billLine}>
                    <Text style={styles.billLineLabel}>{t('partyBuilder.addonsLine', { defaultValue: 'Dish Add-ons ({{guests}} × ₹{{amount}})', guests, amount: extraPerHead })}</Text>
                    <Text style={styles.billLineValue}>+₹{extraTotalAmount}</Text>
                  </View>
                )}
                <View style={styles.billLine}>
                  <Text style={styles.billLineLabel}>{t('partyBuilder.deliveryHandling', 'Delivery & Society Handling')}</Text>
                  <Text style={[styles.billLineValue, { color: '#2E7D32' }]}>{t('partyBuilder.free', 'FREE')}</Text>
                </View>
                <View style={styles.billDivider} />
                <View style={styles.billLineTotal}>
                  <Text style={styles.billTotalLabel}>{t('partyBuilder.grandTotal', 'Grand Total')}</Text>
                  <Text style={styles.billTotalValue}>{money(totalAmount)}</Text>
                </View>
              </View>

              {/* Guarantee Tag */}
              <View style={styles.guaranteeTag}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#2C1B14" />
                <Text style={styles.guaranteeText}>
                  {t('partyBuilder.guaranteeText', 'Chef acceptance notice will be sent. Full refund if declined.')}
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Sticky Bottom Bar */}
          <View style={styles.stickyFooter}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerPerPersonLabel}>
                {step === 'review' ? t('partyBuilder.grandTotal', 'Grand Total') : t('partyBuilder.perPerson', 'Per person')}
              </Text>
              <Text style={styles.footerPerPersonValue}>
                {step === 'review'
                  ? money(totalAmount)
                  : `₹${totalPerHead}${isKidsMenuEnabled ? t('partyBuilder.perKid', { defaultValue: ' + ₹{{price}}/kid', price: kidsMenuPricePerHead }) : ''}`}
              </Text>
              <Text style={styles.footerTotalLabel}>
                {step === 'review'
                  ? t('partyBuilder.guestsScheduled', { defaultValue: '{{guests}} guests {{kids}}scheduled', guests, kids: isKidsMenuEnabled ? t('partyBuilder.plusKids', { defaultValue: '+ {{count}} kids ', count: kidsCount }) : '' })
                  : t('partyBuilder.totalForGuests', { defaultValue: 'Total for {{guests}} guests {{kids}}', guests, kids: isKidsMenuEnabled ? t('partyBuilder.plusKids', { defaultValue: '+ {{count}} kids ', count: kidsCount }).trim() : '' })}
              </Text>
              {step === 'build' && (
                <Text style={styles.footerTotalValue}>{money(totalAmount)}</Text>
              )}
            </View>
            <Pressable
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={step === 'build' ? handleGoToReview : handlePreBook}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? t('partyBuilder.submitting', 'Submitting...') : step === 'build' ? t('partyBuilder.reviewOrder', 'Review order') : t('partyBuilder.confirmPrebooking', 'Confirm Pre-booking')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: any, safeBottom: number = 0) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: '#F7F3EE',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '92%',
      paddingBottom: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5DFD7',
    },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#EAE3DA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: '#2C1B14',
    },
    subtitle: {
      fontSize: 13,
      color: '#6B5E55',
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#EAE3DA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      flexGrow: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 140,
    },
    sectionHeading: {
      fontSize: 18,
      fontWeight: '700',
      color: '#2C1B14',
      marginTop: 16,
      marginBottom: 12,
    },
    packGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    packCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      position: 'relative',
    },
    packCardUnselected: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5DFD7',
    },
    packCardSelected: {
      backgroundColor: '#352119',
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      right: 12,
      backgroundColor: '#D97724',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    popularBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
    packTag: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: '#8A7A70',
      marginBottom: 4,
    },
    packPrice: {
      fontSize: 24,
      fontWeight: '800',
      color: '#2C1B14',
      marginBottom: 10,
    },
    packPriceUnit: {
      fontSize: 13,
      fontWeight: '500',
    },
    packDetails: {
      gap: 4,
    },
    packDetailText: {
      fontSize: 12,
      color: '#5C4E46',
    },
    textWhite: {
      color: '#FFFFFF',
    },
    guestsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      borderWidth: 1,
      borderColor: '#E5DFD7',
    },
    guestsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    guestsLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2C1B14',
    },
    guestsSubLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: '#8A7A70',
      marginTop: 1,
    },
    counterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    counterBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#D4C9BC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    counterBtnDisabled: {
      opacity: 0.4,
    },
    counterBtnAdd: {
      backgroundColor: '#2C1B14',
      borderColor: '#2C1B14',
    },
    counterValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#2C1B14',
      minWidth: 20,
      textAlign: 'center',
    },
    dateCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      marginTop: 16,
      borderWidth: 1,
      borderColor: '#E5DFD7',
    },
    dateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#8A7A70',
    },
    selectedDateBadge: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 10,
      backgroundColor: '#FFF8F0',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F5E6D3',
    },
    selectedDateText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#D97724',
    },
    noticeSubText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#8A7A70',
    },
    subSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#8A7A70',
      marginTop: 8,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dateCarousel: {
      flexDirection: 'row',
      gap: 8,
      paddingBottom: 4,
    },
    dateCardItem: {
      backgroundColor: '#F2ECE4',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 8,
      alignItems: 'center',
      minWidth: 70,
    },
    dateCardItemSelected: {
      backgroundColor: '#2C1B14',
    },
    dateCardLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: '#8A7A70',
    },
    dateCardNum: {
      fontSize: 14,
      fontWeight: '800',
      color: '#2C1B14',
      marginTop: 2,
    },
    timePickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F2ECE4',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 10,
      gap: 12,
    },
    spinnerColumn: {
      alignItems: 'center',
    },
    spinnerArrowBtn: {
      padding: 4,
      borderRadius: 10,
    },
    spinnerValueBox: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 2,
    },
    spinnerValueText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#2C1B14',
    },
    spinnerSubText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#8A7A70',
    },
    spinnerColon: {
      fontSize: 22,
      fontWeight: '800',
      color: '#2C1B14',
      marginHorizontal: 2,
    },
    ampmToggleBox: {
      flexDirection: 'row',
      backgroundColor: '#EAE3DA',
      borderRadius: 12,
      padding: 3,
      marginLeft: 8,
    },
    ampmBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 9,
    },
    ampmBtnActive: {
      backgroundColor: '#D97724',
    },
    ampmBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#5C4E46',
    },
    ampmBtnTextActive: {
      color: '#FFFFFF',
    },
    timeSlotRow: {
      flexDirection: 'row',
      gap: 8,
      paddingBottom: 4,
    },
    timeSlotPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: '#F2ECE4',
    },
    timeSlotPillActive: {
      backgroundColor: '#D97724',
    },
    timeSlotText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#5C4E46',
    },
    timeSlotTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    categoryBlock: {
      marginTop: 12,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#2C1B14',
    },
    capBadge: {
      backgroundColor: '#E8DDD0',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    capBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#5C4E46',
    },
    dishItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dishItemSelected: {
      borderColor: '#352119',
      backgroundColor: '#FDFBF7',
    },
    dishNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    vegBadgeIcon: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: '#2E7D32',
      alignItems: 'center',
      justifyContent: 'center',
    },
    nonVegBadgeIcon: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: '#C62828',
      alignItems: 'center',
      justifyContent: 'center',
    },
    vegDotInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#2E7D32',
    },
    nonVegDotInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#C62828',
    },
    extraCharge: {
      fontSize: 12,
      color: '#D97724',
      fontWeight: '600',
    },
    guestsBadge: {
      backgroundColor: '#EAE3DA',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    guestsBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#5C4E46',
    },
    divider: {
      height: 1,
      backgroundColor: '#E5DFD7',
      marginVertical: 12,
    },
    billDivider: {
      height: 1,
      backgroundColor: '#E5DFD7',
      marginVertical: 10,
    },
    billLineTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    billTotalLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: '#2C1B14',
    },
    billTotalValue: {
      fontSize: 18,
      fontWeight: '800',
      color: '#2C1B14',
    },
    guaranteeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FFF8F0',
      borderRadius: 12,
      padding: 12,
      marginTop: 16,
      borderWidth: 1,
      borderColor: '#F5E6D3',
    },
    guaranteeText: {
      fontSize: 12,
      color: '#5C4E46',
      flex: 1,
    },
    packSub: {
      fontSize: 12,
      color: '#8A7A70',
      marginBottom: 8,
    },
    packFeatures: {
      borderTopWidth: 1,
      borderTopColor: '#E5DFD7',
      paddingTop: 8,
      gap: 4,
    },
    packFeatureText: {
      fontSize: 11,
      color: '#5C4E46',
    },
    dishesHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dietFilterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    dietPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: '#EAE3DA',
    },
    dietPillActive: {
      backgroundColor: '#352119',
    },
    dietPillVegActive: {
      backgroundColor: '#2E7D32',
    },
    dietPillNonVegActive: {
      backgroundColor: '#C62828',
    },
    dietPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#5C4E46',
    },
    dietPillTextActive: {
      color: '#FFFFFF',
    },
    dietPillVegTextActive: {
      color: '#FFFFFF',
    },
    dietPillNonVegTextActive: {
      color: '#FFFFFF',
    },
    categoryCapText: {
      fontSize: 12,
      color: '#8A7A70',
    },
    dishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#E5DFD7',
    },
    dishRowSelected: {
      borderColor: '#352119',
      backgroundColor: '#FDFBF7',
    },
    dishLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    vegDot: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dishName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2C1B14',
    },
    extraBadge: {
      fontSize: 12,
      color: '#8A7A70',
      marginLeft: 4,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#C5BBB2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: '#352119',
      borderColor: '#352119',
    },
    dateRow: {
      flexDirection: 'row',
      gap: 10,
      marginVertical: 8,
    },
    dateChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5DFD7',
      alignItems: 'center',
      minWidth: 80,
    },
    dateChipActive: {
      backgroundColor: '#352119',
      borderColor: '#352119',
    },
    dateChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#5C4E46',
    },
    dateChipSub: {
      fontSize: 11,
      color: '#8A7A70',
      marginTop: 2,
    },
    dateChipTextActive: {
      color: '#FFFFFF',
    },
    timePickerBox: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: '#E5DFD7',
      marginBottom: 12,
    },
    timePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    timePickerCol: {
      alignItems: 'center',
    },
    timePickerLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#8A7A70',
      marginBottom: 4,
    },
    timeInput: {
      width: 50,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#F7F3EE',
      borderWidth: 1,
      borderColor: '#E5DFD7',
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '800',
      color: '#2C1B14',
    },
    timeColon: {
      fontSize: 22,
      fontWeight: '800',
      color: '#2C1B14',
      marginHorizontal: 2,
    },
    ampmCol: {
      flexDirection: 'row',
      gap: 6,
      marginLeft: 8,
    },
    counterLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: '#2C1B14',
    },
    counterSub: {
      fontSize: 12,
      color: '#8A7A70',
      marginTop: 2,
    },
    counterControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    counterBtnActive: {
      backgroundColor: '#352119',
    },
      reviewOverviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5DFD7',
        marginBottom: 16,
      },
      reviewOverviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      reviewOverviewTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#2C1B14',
        flex: 1,
      },
      reviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      },
      reviewRowLabel: {
        fontSize: 13,
        color: '#8A7A70',
      },
      reviewRowValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2C1B14',
      },
      selectedMenuCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5DFD7',
        marginBottom: 16,
      },
      reviewCatTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8A7A70',
        marginBottom: 6,
      },
      reviewDishRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        paddingLeft: 4,
      },
      reviewDishBullet: {
        fontSize: 14,
        color: '#D97724',
      },
      reviewDishName: {
        fontSize: 14,
        color: '#2C1B14',
        flex: 1,
      },
      reviewDishExtra: {
        fontSize: 12,
        color: '#8A7A70',
      },
      billBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5DFD7',
      },
      billLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      },
      billLineLabel: {
        fontSize: 13,
        color: '#5C4E46',
      },
      billLineValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C1B14',
      },
      stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#352119',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: Math.max(14, safeBottom + 8),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
      },
      footerLeft: {},
      footerPerPersonLabel: {
        color: '#B5A599',
        fontSize: 11,
        fontWeight: '500',
      },
      footerPerPersonValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
      },
      footerTotalLabel: {
        color: '#B5A599',
        fontSize: 11,
      },
      footerTotalValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
      },
      submitBtn: {
        backgroundColor: '#D97724',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 12,
      },
      submitBtnDisabled: {
        opacity: 0.6,
      },
      submitBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
      },
    });
