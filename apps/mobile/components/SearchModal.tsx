import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
// React Native's own SafeAreaView doesn't apply status-bar insets on Android
// (it's effectively a no-op there, especially with edgeToEdgeEnabled: true in
// app.json) — it only ever worked on iOS. Every other screen in this app
// already imports the real one from react-native-safe-area-context; this
// modal was the one place still using the built-in version, which is why the
// search bar rendered flush under the status bar on a real Android device.
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { getRatingColor } from '../lib/format';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  allDishes: any[];
  onSelectDish: (dish: any, kitchen: any) => void;
  onCheckout: (kitchenId: string, dishId: string) => void;
}

const THINK_CHIPS = [
  { id: '1', labelKey: 'searchModal.chipLight', label: 'Light meals', query: 'light meal' },
  { id: '2', labelKey: 'searchModal.chipSpicy', label: 'Something spicy', query: 'spicy' },
  { id: '3', labelKey: 'searchModal.chipProtein', label: 'High protein meals', query: 'protein' },
  { id: '4', labelKey: 'searchModal.chipFasting', label: 'Fasting favourites', query: 'fasting' },
];

const INITIAL_RECENT_SEARCHES = ['Poha', 'Paneer Butter Masala', 'Gravy Momos', 'Veg Biryani'];

const MIND_CATEGORIES = [
  { id: '1', titleKey: 'searchModal.mindUnder150', title: 'Under ₹150', query: '150', icon: 'cash-outline', bg: '#EFF6FF' },
  { id: '2', titleKey: 'searchModal.mindNorth', title: 'North Indian', query: 'paneer', icon: 'restaurant-outline', bg: '#FEF3C7' },
  { id: '3', titleKey: 'searchModal.mindSouth', title: 'South Indian', query: 'dosa', icon: 'cafe-outline', bg: '#ECFDF5' },
  { id: '4', titleKey: 'searchModal.mindPoha', title: 'Poha & Snacks', query: 'poha', icon: 'fast-food-outline', bg: '#FFF7ED' },
  { id: '5', titleKey: 'searchModal.mindThali', title: 'Thali & Meals', query: 'thali', icon: 'nutrition-outline', bg: '#F5F3FF' },
  { id: '6', titleKey: 'searchModal.mindDesserts', title: 'Desserts', query: 'halwa', icon: 'ice-cream-outline', bg: '#FDF2F8' },
];

const FILTER_PILLS = [
  { v: 'All', k: 'searchModal.pillAll', f: 'All' },
  { v: 'Under ₹150', k: 'searchModal.pillUnder150', f: 'Under ₹150' },
  { v: 'Veg', k: 'searchModal.pillVeg', f: 'Veg' },
  { v: 'Fast Delivery', k: 'searchModal.pillFastDelivery', f: 'Fast Delivery' },
];

export function SearchModal({
  visible,
  onClose,
  allDishes,
  onSelectDish,
  onCheckout,
}: SearchModalProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(INITIAL_RECENT_SEARCHES);
  const [selectedFilterPill, setSelectedFilterPill] = useState<string | null>(null);

  // Clear query on close
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedFilterPill(null);
    }
  }, [visible]);

  function handleSelectSearch(queryText: string) {
    setSearchQuery(queryText);
    if (!recentSearches.includes(queryText)) {
      setRecentSearches((prev) => [queryText, ...prev].slice(0, 6));
    }
  }

  function handleClearRecent() {
    setRecentSearches([]);
  }

  // Filter dishes based on search query
  const searchResults = allDishes.filter((item) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      (item.dishName && item.dishName.toLowerCase().includes(q)) ||
      (item.kitchenName && item.kitchenName.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));

    const matchesFilterPill =
      !selectedFilterPill ||
      (selectedFilterPill === 'Under ₹150' && Number(item.suggestedPrice || item.price || 0) <= 150) ||
      (selectedFilterPill === 'Veg' && (item.category === 'Veg' || item.foodType === 'Veg'));

    return matchesQuery && matchesFilterPill;
  });

  // Auto-complete suggestions list
  const suggestions = searchQuery.trim()
    ? Array.from(
        new Set(
          allDishes
            .map((d) => d.dishName)
            .filter((name) => name && name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
        )
      ).slice(0, 5)
    : [];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* ── Top Header Search Bar ────────────────────────────────────────── */}
          <View style={styles.topHeader}>
            <Pressable style={styles.backBtn} onPress={onClose} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color={Colors.dark} />
            </Pressable>

            <View style={styles.searchInputWrap}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('searchModal.placeholder', "Search 'homestyle meals', 'poha', 'paneer'...")}
                placeholderTextColor="#94A3B8"
                autoFocus
                clearButtonMode="never"
              />
              {searchQuery !== '' && (
                <Pressable onPress={() => setSearchQuery('')} style={{ marginRight: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── STATE 1: Empty Query — Pre-search Discover Content ──────────── */}
            {searchQuery.trim() === '' ? (
              <View>
                {/* 1. Think it, search it */}
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionScriptTitle}>{t('searchModal.thinkSearch', 'Think it, search it')}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScroll}
                  >
                    {THINK_CHIPS.map((chip) => (
                      <Pressable
                        key={chip.id}
                        style={styles.thinkChip}
                        onPress={() => handleSelectSearch(chip.query)}
                      >
                        <Ionicons name="sparkles" size={14} color="#E86A2E" style={{ marginRight: 6 }} />
                        <Text style={styles.thinkChipText}>{t(chip.labelKey, chip.label)}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* 2. Your Recent Searches */}
                {recentSearches.length > 0 && (
                  <View style={styles.sectionWrap}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionHeaderTitle}>{t('searchModal.recentSearches', 'YOUR RECENT SEARCHES')}</Text>
                      <Pressable onPress={handleClearRecent}>
                        <Text style={styles.clearText}>{t('searchModal.clear', 'Clear')}</Text>
                      </Pressable>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsScroll}
                    >
                      {recentSearches.map((item, idx) => (
                        <Pressable
                          key={idx}
                          style={styles.recentChip}
                          onPress={() => handleSelectSearch(item)}
                        >
                          <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                          <Text style={styles.recentChipText}>{item}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* 3. What's on your mind? */}
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionHeaderTitle}>{t('searchModal.onYourMind', "WHAT'S ON YOUR MIND?")}</Text>
                  <View style={styles.mindGrid}>
                    {MIND_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={[styles.mindCard, { backgroundColor: cat.bg }]}
                        onPress={() => handleSelectSearch(cat.query)}
                      >
                        <View style={styles.mindIconWrap}>
                          <Ionicons name={cat.icon as any} size={26} color={Colors.primary} />
                        </View>
                        <Text style={styles.mindTitle} numberOfLines={1}>{t(cat.titleKey, cat.title)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              /* ── STATE 2 & 3: Active Search Query & Results ───────────────── */
              <View>
                {/* Auto-complete Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((name, i) => (
                      <Pressable
                        key={i}
                        style={styles.suggestionRow}
                        onPress={() => handleSelectSearch(name)}
                      >
                        <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 10 }} />
                        <Text style={styles.suggestionText}>{name}</Text>
                        <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Results Header */}
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>
                    {t('searchModal.showingResults', 'Showing results for ')}<Text style={{ color: Colors.primary }}>"{searchQuery}"</Text>
                  </Text>
                  <Text style={styles.resultsCount}>{t('searchModal.itemsFound', { defaultValue: '{{count}} items found', count: searchResults.length })}</Text>
                </View>

                {/* Quick Filter Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterPillsScroll}
                >
                  {FILTER_PILLS.map((pill) => {
                    const isSelected = selectedFilterPill === pill.v || (pill.v === 'All' && !selectedFilterPill);
                    return (
                      <Pressable
                        key={pill.v}
                        style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                        onPress={() => setSelectedFilterPill(pill.v === 'All' ? null : pill.v)}
                      >
                        <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                          {t(pill.k, pill.f)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Search Results List */}
                {searchResults.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>{t('searchModal.noDishesFound', { defaultValue: 'No dishes found for "{{query}}"', query: searchQuery })}</Text>
                    <Text style={styles.emptySub}>
                      {t('searchModal.trySearching', "Try searching for 'poha', 'paneer', 'thali', or 'biryani'.")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.resultsList}>
                    {searchResults.map((item, idx) => {
                      const price = item.suggestedPrice || item.price || 140;
                      return (
                        <Pressable
                          key={item.id || idx}
                          style={styles.resultCard}
                          onPress={() =>
                            onSelectDish(
                              {
                                id: item.id,
                                name: item.dishName,
                                category: item.category || 'Veg',
                                description: item.description || t('searchModal.freshMeal', 'Fresh home cooked meal.'),
                                price,
                              },
                              {
                                id: item.chefId,
                                name: item.kitchenName,
                                rating: item.kitchenRating || 0,
                              }
                            )
                          }
                        >
                          <Image
                            source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
                            style={styles.resultImage}
                          />
                          <View style={styles.resultBody}>
                            <View style={styles.resultTopRow}>
                              <Text style={styles.resultDishName} numberOfLines={1}>
                                {item.dishName}
                              </Text>
                              {item.kitchenRating > 0 ? (
                                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.kitchenRating) }]}>
                                  <Ionicons name="star" size={10} color="#FFF" />
                                  <Text style={styles.ratingText}>{item.kitchenRating}</Text>
                                </View>
                              ) : (
                                <View style={[styles.ratingBadge, { backgroundColor: Colors.muted }]}>
                                  <Text style={styles.ratingText}>{t('searchModal.notRated', 'Not Rated')}</Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.resultKitchenName}>{item.kitchenName || t('searchModal.homeKitchen', 'Home Kitchen')}</Text>
                            <Text style={styles.resultPriceText}>{t('searchModal.priceMins', { defaultValue: '₹{{price}} • 25-30 mins', price })}</Text>

                            <View style={styles.resultFooter}>
                              <Text style={styles.vegTag}>
                                {item.category === 'Veg' ? t('searchModal.pureVeg', '🥬 Pure Veg') : t('searchModal.nonVeg', '🍗 Non-Veg')}
                              </Text>
                              <Pressable
                                style={styles.addBtn}
                                onPress={() => onCheckout(item.chefId || 'k-1', item.id)}
                              >
                                <Text style={styles.addBtnText}>{t('searchModal.addPlus', 'ADD +')}</Text>
                              </Pressable>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function getStyles(Colors: any) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    backBtn: {
      paddingRight: 10,
    },
    searchInputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F1F5F9',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: '#0F172A',
      paddingVertical: 0,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    sectionWrap: {
      marginTop: 18,
      paddingHorizontal: 16,
    },
    sectionScriptTitle: {
      fontSize: 18,
      fontStyle: 'italic',
      fontWeight: '700',
      color: '#334155',
      marginBottom: 10,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionHeaderTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#64748B',
      letterSpacing: 0.8,
    },
    clearText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#EF4444',
    },
    chipsScroll: {
      gap: 10,
    },
    thinkChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    thinkChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1E293B',
    },
    recentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    recentChipText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: '#334155',
    },
    mindGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 10,
    },
    mindCard: {
      width: '31%',
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    mindIconWrap: {
      marginBottom: 6,
    },
    mindTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#1E293B',
      textAlign: 'center',
    },
    suggestionsContainer: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      paddingHorizontal: 16,
    },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    suggestionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: '#1E293B',
    },
    resultsHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    resultsTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#0F172A',
    },
    resultsCount: {
      fontSize: 12,
      color: '#64748B',
      marginTop: 2,
    },
    filterPillsScroll: {
      paddingHorizontal: 16,
      gap: 8,
      paddingVertical: 10,
    },
    filterPill: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: '#CBD5E1',
    },
    filterPillSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    filterPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#475569',
    },
    filterPillTextSelected: {
      color: '#FFFFFF',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 40,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#334155',
      marginTop: 12,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 13,
      color: '#64748B',
      marginTop: 4,
      textAlign: 'center',
    },
    resultsList: {
      paddingHorizontal: 16,
      gap: 12,
      marginTop: 8,
    },
    resultCard: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    resultImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
      marginRight: 12,
    },
    resultBody: {
      flex: 1,
      justifyContent: 'space-between',
    },
    resultTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resultDishName: {
      fontSize: 15,
      fontWeight: '800',
      color: '#0F172A',
      flex: 1,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 3,
    },
    ratingText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
    resultKitchenName: {
      fontSize: 12,
      color: '#64748B',
      marginTop: 1,
    },
    resultPriceText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1E293B',
      marginTop: 4,
    },
    resultFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    vegTag: {
      fontSize: 11,
      fontWeight: '700',
      color: '#16A34A',
    },
    addBtn: {
      backgroundColor: '#ECFDF5',
      borderWidth: 1,
      borderColor: '#10B981',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    addBtnText: {
      color: '#059669',
      fontSize: 12,
      fontWeight: '900',
    },
  });
}
