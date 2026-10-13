import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (sortBy: string, vegFilter: string, mealTypeFilter: string) => void;
  initialSortBy: string;
  initialVegFilter: string;
  initialMealTypeFilter: string;
};

const SIDEBAR_TABS = [
  { id: 'sort', labelKey: 'filterModal.tabSort', label: 'Sort By', icon: 'swap-vertical' },
  { id: 'dietary', labelKey: 'filterModal.tabDietary', label: 'Dietary', icon: 'leaf-outline' },
  { id: 'meal', labelKey: 'filterModal.tabMeal', label: 'Meal Type', icon: 'restaurant-outline' },
];

export function FilterModal({
  visible,
  onClose,
  onApply,
  initialSortBy,
  initialVegFilter,
  initialMealTypeFilter,
}: FilterModalProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const optLabel = (opt: string) => {
    switch (opt) {
      case 'All': return t('filterModal.optAll', 'All');
      case 'Veg': return t('common.veg', 'Veg');
      case 'Non-Veg': return t('filterModal.optNonVeg', 'Non-Veg');
      case 'Breakfast': return t('filterModal.optBreakfast', 'Breakfast');
      case 'Lunch': return t('filterModal.optLunch', 'Lunch');
      case 'Dinner': return t('filterModal.optDinner', 'Dinner');
      case 'Snacks': return t('filterModal.optSnacks', 'Snacks');
      default: return opt;
    }
  };

  const [activeTab, setActiveTab] = useState('sort');

  // Local state for filters
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [vegFilter, setVegFilter] = useState(initialVegFilter);
  const [mealType, setMealType] = useState(initialMealTypeFilter);

  // Sync when opened
  useEffect(() => {
    if (visible) {
      setSortBy(initialSortBy);
      setVegFilter(initialVegFilter);
      setMealType(initialMealTypeFilter);
      setActiveTab('sort'); // Reset to first tab
    }
  }, [visible, initialSortBy, initialVegFilter, initialMealTypeFilter]);

  const handleClearAll = () => {
    setSortBy('society');
    setVegFilter('All');
    setMealType('All');
  };

  const handleShowResults = () => {
    onApply(sortBy, vegFilter, mealType);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'sort':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>{t('filterModal.sortByTitle', 'Sort by')}</Text>
            <View style={styles.radioGroup}>
              {['society', 'price', 'rating'].map((opt) => (
                <Pressable
                  key={opt}
                  style={styles.radioRow}
                  onPress={() => setSortBy(opt)}
                >
                  <View style={styles.radioInnerRow}>
                    <View style={[styles.radioCircle, sortBy === opt && styles.radioCircleActive]}>
                      {sortBy === opt && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {opt === 'society' ? t('filterModal.sortRelevance', 'Relevance (Same Society)') : opt === 'price' ? t('filterModal.sortPriceLowHigh', 'Price (Low to High)') : t('filterModal.sortRatingHighLow', 'Rating (High to Low)')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'dietary':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>{t('filterModal.dietaryPreferences', 'Dietary Preferences')}</Text>
            <View style={styles.chipGrid}>
              {['All', 'Veg', 'Non-Veg'].map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.filterChip, vegFilter === opt && styles.filterChipActive]}
                  onPress={() => setVegFilter(opt)}
                >
                  <Text style={[styles.filterChipText, vegFilter === opt && styles.filterChipTextActive]}>
                    {optLabel(opt)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'meal':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>{t('filterModal.mealTypeTitle', 'Meal Type')}</Text>
            <View style={styles.chipGrid}>
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.filterChip, mealType === opt && styles.filterChipActive]}
                  onPress={() => setMealType(opt)}
                >
                  <Text style={[styles.filterChipText, mealType === opt && styles.filterChipTextActive]}>
                    {optLabel(opt)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('filterModal.title', 'Filters and sorting')}</Text>
            <Pressable onPress={handleClearAll}>
              <Text style={styles.clearText}>{t('filterModal.clearAll', 'Clear All')}</Text>
            </Pressable>
          </View>

          <View style={styles.body}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {SIDEBAR_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      style={[styles.sidebarTab, isActive && styles.sidebarTabActive]}
                      onPress={() => setActiveTab(tab.id)}
                    >
                      {isActive && <View style={styles.activeTabIndicator} />}
                      <Ionicons
                        name={tab.icon as any}
                        size={20}
                        color={isActive ? Colors.primary : Colors.muted}
                        style={styles.tabIcon}
                      />
                      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                        {t(tab.labelKey, tab.label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {renderContent()}
              </ScrollView>
            </View>
          </View>

          {/* Footer */}
          <SafeAreaView style={styles.footer} edges={['bottom']}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t('filterModal.close', 'Close')}</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={handleShowResults}>
              <Text style={styles.applyButtonText}>{t('filterModal.showResults', 'Show results')}</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: { maxWidth: 600, width: '100%', alignSelf: 'center', height: '80vh' } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 100,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  sidebarTab: {
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
  },
  sidebarTabActive: {
    backgroundColor: Colors.surface,
  },
  activeTabIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    marginBottom: 6,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    textAlign: 'center',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '900',
  },
  contentArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    padding: 20,
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 16,
  },
  radioGroup: {
    gap: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.muted,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 12,
  },
  closeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
