import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import DishCard from './DishCard';
import DishCardSkeleton from './DishCardSkeleton';
import { useThemeStore } from '../../store/useThemeStore';
import type { WeeklyDish, DayKey } from '../../types';

import { getWeekDates, formatNiceDate } from '../../lib/dateUtils';

const DAYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type WeeklyPlannerProps = {
  dishesByDay: Record<DayKey, WeeklyDish[]>;
  loading?: boolean;
  onAddDish: (dish: WeeklyDish) => void;
  onUpdateDish: (dish: WeeklyDish) => void;
  onDeleteDish: (day: DayKey, id: string) => void;
  onDuplicateDish: (dish: WeeklyDish, targetDay: DayKey) => void;
  onCopyDay: (fromDay: DayKey, toDay: DayKey) => void;
  onClearDay: (day: DayKey) => void;
};

// Purely presentational — all persistence (mock vs real backend) is owned by
// the parent screen, which already has the real kitchen id and data-loading
// logic. This component previously read/wrote its own disconnected
// in-memory-only store (useWeeklyPlannerStore) with no backend persistence
// at all, so nothing saved here was ever visible anywhere else.
export default function WeeklyPlanner({
  dishesByDay,
  loading,
  onAddDish,
  onUpdateDish,
  onDeleteDish,
  onDuplicateDish,
  onCopyDay,
  onClearDay,
}: WeeklyPlannerProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const dayFull = (d: string) => t(`weekly.day.${d}`, d);
  const dayShort = (d: string) => t(`weekly.dayShort.${d}`, d);
  const [selectedDay, setSelectedDay] = useState<DayKey>('Mon');
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [editingDish, setEditingDish] = useState<WeeklyDish | null>(null);

  // Form fields
  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState<'Veg' | 'Non-Veg'>('Veg');
  const [mealType, setMealType] = useState('Lunch');
  const [price, setPrice] = useState('120');
  const [quantity, setQuantity] = useState('20');
  const [closeTime, setCloseTime] = useState(new Date());
  const [closeTimeText, setCloseTimeText] = useState('10:30 PM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [description, setDescription] = useState('');

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [mealFilter, setMealFilter] = useState<string>('All');

  // Pagination Buffer State (Load 5 dishes initially, then load 5 more on scroll/button)
  const INITIAL_LIMIT = 5;
  const BATCH_SIZE = 5;
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_LIMIT);

  // Reset pagination buffer whenever day/filter changes
  React.useEffect(() => {
    setDisplayLimit(INITIAL_LIMIT);
  }, [selectedDay, searchQuery, catFilter, mealFilter]);

  const dayDishes = dishesByDay[selectedDay] || [];

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return dayDishes.filter((d) => {
      if (searchQuery.trim() && !d.dishName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (catFilter !== 'All' && d.category !== catFilter) return false;
      if (mealFilter !== 'All' && d.mealType !== mealFilter) return false;
      return true;
    });
  }, [dayDishes, searchQuery, catFilter, mealFilter]);

  const visibleDishes = useMemo(() => {
    return filteredDishes.slice(0, displayLimit);
  }, [filteredDishes, displayLimit]);

  // Analytics summary
  const analytics = useMemo(() => {
    const totalDishes = dayDishes.length;
    const totalPortions = dayDishes.reduce((sum, d) => sum + d.quantity, 0);
    const totalRevenue = dayDishes.reduce((sum, d) => sum + d.price * d.quantity, 0);
    return { totalDishes, totalPortions, totalRevenue };
  }, [dayDishes]);

  // Reset modal form
  function resetForm() {
    setEditingDish(null);
    setDishName('');
    setCategory('Veg');
    setMealType('Lunch');
    setPrice('120');
    setQuantity('20');
    setCloseTime(new Date());
    setCloseTimeText('10:30 PM');
    setDescription('');
  }

  // Open Modal for Create or Edit
  function openModalForCreate() {
    resetForm();
    setShowAddDishModal(true);
  }

  function openModalForEdit(dish: WeeklyDish) {
    setEditingDish(dish);
    setDishName(dish.dishName);
    setCategory(dish.category);
    setMealType(dish.mealType);
    setPrice(String(dish.price));
    setQuantity(String(dish.quantity));
    setCloseTimeText(dish.closeTime);
    setDescription(dish.description || '');
    setShowAddDishModal(true);
  }

  const onTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setCloseTime(selectedTime);
      setCloseTimeText(
        selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }
  };

  // Save Dish (Add or Update)
  function handleSaveDish() {
    if (!dishName.trim()) {
      Alert.alert(t('wPlanner.requiredTitle', 'Required Field'), t('wPlanner.requiredBody', 'Please enter a dish name.'));
      return;
    }
    const parsedPrice = parseFloat(price) || 100;
    const parsedQty = parseInt(quantity, 10) || 15;

    const formattedTime =
      Platform.OS === 'web'
        ? closeTimeText.trim() || '10:30 PM'
        : closeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (editingDish) {
      const updated: WeeklyDish = {
        ...editingDish,
        dishName: dishName.trim(),
        category,
        foodType: category === 'Veg' ? 'Veg' : 'NonVeg',
        mealType,
        price: parsedPrice,
        quantity: parsedQty,
        maxServings: parsedQty,
        remainingQuantity: Math.min(editingDish.remainingQuantity, parsedQty),
        closeTime: formattedTime,
        description: description.trim() || undefined,
      };
      onUpdateDish(updated);
    } else {
      const selectedItem = calendarDates.find((item) => item.dayKey === selectedDay) || calendarDates[0];
      const newDish: WeeklyDish = {
        id: `wd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        day: selectedDay,
        date: selectedItem?.dateStr,
        dishName: dishName.trim(),
        category,
        foodType: category === 'Veg' ? 'Veg' : 'NonVeg',
        mealType,
        price: parsedPrice,
        quantity: parsedQty,
        maxServings: parsedQty,
        remainingQuantity: parsedQty,
        remainingServings: parsedQty,
        prepTimeMinutes: 60,
        description: description.trim() || undefined,
        closeTime: formattedTime,
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      onAddDish(newDish);
    }

    setShowAddDishModal(false);
    resetForm();
  }

  // Delete handler
  function handleDelete(id: string) {
    onDeleteDish(selectedDay, id);
  }

  // Clear Day handler
  function handleClearDay() {
    Alert.alert(
      t('wPlanner.clearDayTitle', 'Clear Day'),
      t('wPlanner.clearDayBody', { defaultValue: 'Are you sure you want to remove all dishes scheduled for {{day}}?', day: dayShort(selectedDay) }),
      [
        { text: t('wPlanner.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('wPlanner.clearAll', 'Clear All'),
          style: 'destructive',
          onPress: () => onClearDay(selectedDay),
        },
      ]
    );
  }

  // Status Change handler
  function handleStatusChange(dish: WeeklyDish, newStatus: WeeklyDish['status']) {
    if (newStatus === 'active' && dish.status === 'sold_out') {
      const newQty = dish.remainingQuantity + 5;
      onUpdateDish({
        ...dish,
        remainingQuantity: newQty,
        remainingServings: newQty,
        quantity: Math.max(dish.quantity, newQty),
        status: 'active',
      });
    } else {
      onUpdateDish({ ...dish, status: newStatus });
    }
  }

  const calendarDates = getWeekDates(new Date(), 14);

  return (
    <View style={styles.container}>
      {/* ── Calendar Date Selection Tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayContainer}>
        {calendarDates.map((item) => {
          const isSelected = selectedDay === item.dayKey;
          const count = (dishesByDay[item.dayKey] || []).length;
          return (
            <Pressable
              key={item.dateStr}
              onPress={() => setSelectedDay(item.dayKey)}
              style={[styles.dayChip, isSelected && styles.dayChipActive]}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                {item.isToday ? t('wPlanner.today', 'Today') : (item.isTomorrow ? t('wPlanner.tomorrow', 'Tomorrow') : item.shortLabel)}
              </Text>
              {count > 0 && (
                <View style={[styles.countDot, isSelected && styles.countDotActive]}>
                  <Text style={[styles.countDotText, isSelected && styles.countDotTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Day Header & Analytics ── */}
      <View style={styles.dayHeaderRow}>
        <View style={styles.dayTitleWrap}>
          <Text style={styles.dayTitle}>{t('wPlanner.daySchedule', { defaultValue: "{{day}}'s Schedule", day: dayFull(selectedDay) })}</Text>
          <Text style={styles.daySub}>
            {t('wPlanner.dayStats', {
              defaultValue: '{{count}} dishes · {{portions}} portions · Potential revenue ₹{{revenue}}',
              count: analytics.totalDishes,
              portions: analytics.totalPortions,
              revenue: analytics.totalRevenue,
            })}
          </Text>
        </View>
        <View style={styles.dayActions}>
          <Pressable style={styles.iconBtn} onPress={() => setShowCopyModal(true)} accessibilityLabel="Copy schedule to another day">
            <Ionicons name="copy-outline" size={16} color={Colors.primary} />
          </Pressable>
          {dayDishes.length > 0 && (
            <Pressable style={styles.iconBtn} onPress={handleClearDay} accessibilityLabel="Clear day schedule">
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </Pressable>
          )}
          <Pressable style={styles.addDishBtnTop} onPress={openModalForCreate}>
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.addDishBtnTopText}>{t('wPlanner.addDish', 'Add Dish')}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Search & Filter Bar ── */}
      {dayDishes.length > 0 && (
        <View style={styles.filterBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={Colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('wPlanner.searchPh', 'Search dishes...')}
              placeholderTextColor={Colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.muted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.chipRow}>
            {(['All', 'Veg', 'Non-Veg'] as const).map((cat) => (
              <Pressable
                key={cat}
                style={[styles.filterChip, catFilter === cat && styles.filterChipActive]}
                onPress={() => setCatFilter(cat)}
              >
                <Text style={[styles.filterChipText, catFilter === cat && styles.filterChipTextActive]}>
                  {cat === 'All' ? t('wPlanner.filterAll', 'All') : cat === 'Veg' ? t('wPlanner.filterVeg', 'Veg') : t('wPlanner.filterNonVeg', 'Non-Veg')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* ── Scheduled Dishes List, Loading Skeleton, or Empty State ── */}
      {loading ? (
        <View style={styles.dishList}>
          <DishCardSkeleton />
          <DishCardSkeleton />
          <DishCardSkeleton />
        </View>
      ) : filteredDishes.length > 0 ? (
        <View style={styles.dishList}>
          {visibleDishes.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              onEdit={openModalForEdit}
              onDelete={handleDelete}
              onDuplicate={(d, targetDay) => onDuplicateDish(d, targetDay)}
              onStatusChange={handleStatusChange}
            />
          ))}

          {/* Buffer Indicator & Load Next 5 Dishes Button */}
          {displayLimit < filteredDishes.length ? (
            <Pressable
              style={{
                backgroundColor: '#FAF6F0',
                borderWidth: 1.5,
                borderColor: '#E8E1D9',
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 10,
                flexDirection: 'row',
                gap: 8,
              }}
              onPress={() => setDisplayLimit((prev) => Math.min(prev + BATCH_SIZE, filteredDishes.length))}
            >
              <Ionicons name="arrow-down-circle-outline" size={18} color={Colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.dark }}>
                {t('wPlanner.showingCount', {
                  defaultValue: 'Showing {{shown}} of {{total}} dishes · Tap to load next 5',
                  shown: visibleDishes.length,
                  total: filteredDishes.length,
                })}
              </Text>
            </Pressable>
          ) : filteredDishes.length > INITIAL_LIMIT ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: Colors.muted, fontWeight: '600' }}>
                {t('wPlanner.allLoaded', {
                  defaultValue: 'All {{total}} dishes loaded for {{day}} ✓',
                  total: filteredDishes.length,
                  day: dayShort(selectedDay),
                })}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={36} color={Colors.muted} style={{ alignSelf: 'center', marginBottom: 8 }} />
          <Text style={styles.emptyTitle}>
            {dayDishes.length === 0
              ? t('wPlanner.noDishesDay', { defaultValue: 'No dishes scheduled for {{day}}', day: dayShort(selectedDay) })
              : t('wPlanner.noMatch', 'No matching dishes found')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {dayDishes.length === 0
              ? t('wPlanner.emptyHintDay', 'Publish your menu upfront so nearby residents can pre-order early.')
              : t('wPlanner.emptyHintFilter', 'Try clearing your search or filter tags.')}
          </Text>
          {dayDishes.length === 0 && (
            <Pressable style={styles.addDishButton} onPress={openModalForCreate}>
              <Text style={styles.addDishButtonText}>{t('wPlanner.addDishForDay', { defaultValue: '+ Add Dish for {{day}}', day: dayShort(selectedDay) })}</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Add / Edit Dish Modal ── */}
      <Modal
        visible={showAddDishModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddDishModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingDish ? t('wPlanner.editTitle', 'Edit Dish Schedule') : t('wPlanner.addTitleForDay', { defaultValue: 'Add Dish for {{day}}', day: dayShort(selectedDay) })}</Text>
                <Pressable onPress={() => setShowAddDishModal(false)}>
                  <Ionicons name="close" size={20} color={Colors.muted} />
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>{t('wPlanner.dishNameLabel', 'Dish Name *')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('wPlanner.dishNamePh', 'e.g. Special Rajma Chawal')}
                value={dishName}
                onChangeText={setDishName}
              />

              <Text style={styles.fieldLabel}>{t('wPlanner.categoryLabel', 'Category *')}</Text>
              <View style={styles.optionRow}>
                <Pressable
                  style={[styles.optionButton, category === 'Veg' && styles.optionButtonActive]}
                  onPress={() => setCategory('Veg')}
                >
                  <Text style={[styles.optionButtonText, category === 'Veg' && styles.optionButtonTextActive]}>
                    {t('wPlanner.catVeg', '🟢 Veg')}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.optionButton, category === 'Non-Veg' && styles.optionButtonActive]}
                  onPress={() => setCategory('Non-Veg')}
                >
                  <Text style={[styles.optionButtonText, category === 'Non-Veg' && styles.optionButtonTextActive]}>
                    {t('wPlanner.catNonVeg', '🔴 Non-Veg')}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>{t('wPlanner.mealLabel', 'Meal Type *')}</Text>
              <View style={styles.optionRow}>
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => (
                  <Pressable
                    key={meal}
                    style={[styles.smallOptionButton, mealType === meal && styles.optionButtonActive]}
                    onPress={() => setMealType(meal)}
                  >
                    <Text style={[styles.optionButtonText, mealType === meal && styles.optionButtonTextActive]}>
                      {t(`wPlanner.meal.${meal}`, meal)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{t('wPlanner.priceLabel', 'Price (₹) *')}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="120"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{t('wPlanner.portionLabel', 'Portion Limit *')}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="20"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>{t('wPlanner.closeTimeLabel', 'Pre-booking Close Time *')}</Text>
              {Platform.OS === 'web' ? (
                <TextInput
                  style={styles.input}
                  placeholder={t('wPlanner.closeTimePh', 'e.g. 10:30 PM')}
                  value={closeTimeText}
                  onChangeText={setCloseTimeText}
                />
              ) : (
                <>
                  <Pressable style={styles.input} onPress={() => setShowTimePicker(true)}>
                    <Text style={{ fontSize: 15, color: Colors.dark }}>
                      {closeTimeText || closeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Pressable>
                  {showTimePicker && (
                    <DateTimePicker
                      value={closeTime}
                      mode="time"
                      is24Hour={false}
                      display="default"
                      onChange={onTimeChange}
                    />
                  )}
                </>
              )}

              <Text style={styles.fieldLabel}>{t('wPlanner.descLabel', 'Description (Optional)')}</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                textAlignVertical="top"
                placeholder={t('wPlanner.descPh', 'Fresh ingredients, authentic family recipe...')}
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.actionRowModal}>
                <Pressable style={styles.cancelButton} onPress={() => setShowAddDishModal(false)}>
                  <Text style={styles.cancelButtonText}>{t('wPlanner.cancel', 'Cancel')}</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSaveDish}>
                  <Text style={styles.saveButtonText}>{editingDish ? t('wPlanner.updateDish', 'Update Dish') : t('wPlanner.saveDish', 'Save Dish')}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Copy Day Modal ── */}
      <Modal
        visible={showCopyModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCopyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.copyModalCard}>
            <Text style={styles.modalTitle}>{t('wPlanner.copyTitle', { defaultValue: "Copy {{day}}'s Schedule", day: dayShort(selectedDay) })}</Text>
            <Text style={styles.modalSubtitle}>{t('wPlanner.copyBody', { defaultValue: 'Duplicate all scheduled dishes from {{day}} to another day:', day: dayShort(selectedDay) })}</Text>
            <View style={styles.copyDaysGrid}>
              {DAYS.filter((d) => d !== selectedDay).map((targetDay) => (
                <Pressable
                  key={targetDay}
                  style={styles.copyTargetChip}
                  onPress={() => {
                    onCopyDay(selectedDay, targetDay);
                    setShowCopyModal(false);
                    Alert.alert(t('wPlanner.copiedTitle', 'Schedule Copied'), t('wPlanner.copiedBody', { defaultValue: "Successfully duplicated {{from}}'s dishes to {{to}}.", from: dayShort(selectedDay), to: dayShort(targetDay) }));
                  }}
                >
                  <Text style={styles.copyTargetText}>{dayShort(targetDay)}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.cancelCopyBtn} onPress={() => setShowCopyModal(false)}>
              <Text style={styles.cancelCopyText}>{t('wPlanner.cancel', 'Cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    marginTop: 8,
  },
  dayContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 4,
    marginBottom: 14,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.pillInactive,
    gap: 4,
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.muted,
  },
  dayTextActive: {
    color: '#FFF',
  },
  countDot: {
    backgroundColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  countDotActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark,
  },
  countDotTextActive: {
    color: '#FFF',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  dayTitleWrap: {
    flex: 1,
    paddingRight: 4,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  daySub: {
    fontSize: 11.5,
    color: Colors.muted,
    marginTop: 2,
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.pillInactive,
  },
  addDishBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addDishBtnTopText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  filterBar: {
    marginBottom: 14,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
    padding: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.pillInactive,
  },
  filterChipActive: {
    backgroundColor: Colors.dark,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  dishList: {
    gap: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  addDishButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addDishButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.surfaceAlt,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  smallOptionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
  optionButtonTextActive: {
    color: '#FFF',
  },
  actionRowModal: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.pillInactive,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.muted,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  copyModalCard: {
    width: '90%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  copyDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
  },
  copyTargetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  copyTargetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  cancelCopyBtn: {
    paddingVertical: 8,
  },
  cancelCopyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
  },
});