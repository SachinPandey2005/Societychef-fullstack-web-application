import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';

export type PartyKitchenItem = {
  kitchenId: string;
  kitchenName: string;
  society?: string;
  rating?: number;
  minGuests: number;
  minPricePerHead: number;
  tags?: string[];
};

type PartyKitchenSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
  kitchens: PartyKitchenItem[];
  onSelectKitchen: (kitchen: PartyKitchenItem) => void;
};

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const BASE_FILTER_TAGS = [
  { id: 'veg', icon: 'leaf-outline' as const },
  { id: 'non-veg', icon: 'nutrition-outline' as const },
  { id: 'jain', icon: 'flower-outline' as const },
  { id: 'bengali', icon: 'fish-outline' as const },
  { id: 'punjabi', icon: 'fast-food-outline' as const },
  { id: 'south-indian', icon: 'restaurant-outline' as const },
  { id: 'continental', icon: 'pizza-outline' as const },
  { id: 'more', icon: 'ellipsis-horizontal-outline' as const },
];

const EXTRA_FILTER_TAGS = [
  { id: 'north-indian', icon: 'restaurant-outline' as const },
  { id: 'maharashtrian', icon: 'flame-outline' as const },
  { id: 'chinese', icon: 'fast-food-outline' as const },
  { id: 'desserts', icon: 'ice-cream-outline' as const },
];

export function PartyKitchenSelectorModal({
  visible,
  onClose,
  kitchens,
  onSelectKitchen,
}: PartyKitchenSelectorModalProps) {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);

  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [showMoreCategories, setShowMoreCategories] = React.useState(false);

  const tagLabel = (id: string, isLess = false) => t(`partyKitchen.tag.${isLess ? 'less' : id}`, id);

  const filterTagsList = React.useMemo(() => {
    return showMoreCategories
      ? [...BASE_FILTER_TAGS.filter((x) => x.id !== 'more'), ...EXTRA_FILTER_TAGS, { id: 'more', icon: 'chevron-up-outline' as const, isLess: true }]
      : BASE_FILTER_TAGS;
  }, [showMoreCategories]);

  const baseList: PartyKitchenItem[] = kitchens;

  const toggleTag = (tagId: string) => {
    if (tagId === 'more') {
      setShowMoreCategories((prev) => !prev);
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId]
    );
  };

  const filteredList = React.useMemo(() => {
    if (selectedTags.length === 0) return baseList;
    return baseList.filter((k) => {
      const kTags = k.tags || ['veg'];
      return selectedTags.some((x) => kTags.includes(x));
    });
  }, [baseList, selectedTags]);

  const INITIAL_LIMIT = 10;
  const BATCH_SIZE = 8;
  const [displayCount, setDisplayCount] = React.useState<number>(INITIAL_LIMIT);

  React.useEffect(() => {
    if (visible) {
      setDisplayCount(INITIAL_LIMIT);
    }
  }, [visible]);

  function handleScroll(event: any) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 220;

    if (isCloseToBottom && displayCount < filteredList.length) {
      setDisplayCount((prev) => Math.min(prev + BATCH_SIZE, filteredList.length));
    }
  }

  const visibleList = filteredList.slice(0, displayCount);

  const selectedLabels = selectedTags
    .map((id) => tagLabel(id))
    .filter(Boolean)
    .join(' + ');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('partyKitchen.title', 'Party mode kitchens')}</Text>
              <Text style={styles.subtitle}>{t('partyKitchen.subtitle', 'What are you in the mood for?')}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#2C1B14" />
            </Pressable>
          </View>

          {/* Filter Tags Grid */}
          <View style={styles.filterSection}>
            <View style={styles.tagGrid}>
              {filterTagsList.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    style={[styles.tagCard, isSelected && styles.tagCardSelected]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <Ionicons
                      name={tag.icon}
                      size={18}
                      color={isSelected ? '#73E6A4' : '#C8653B'}
                    />
                    <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>
                      {tagLabel(tag.id, (tag as any).isLess)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Active Selected Bar */}
            {selectedTags.length > 0 && (
              <View style={styles.activeFilterRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="funnel-outline" size={14} color="#C8653B" />
                  <Text style={styles.activeFilterText}>{t('partyKitchen.selected', { defaultValue: '{{labels}} selected', labels: selectedLabels })}</Text>
                </View>
                <Pressable onPress={() => setSelectedTags([])}>
                  <Text style={styles.clearText}>{t('partyKitchen.clear', 'Clear')}</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.matchCountText}>
              {t('partyKitchen.matchCount', { count: filteredList.length })}
            </Text>
          </View>

          {/* Kitchen List */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={100}
          >
            {visibleList.map((item) => {
              const isVeg = item.tags?.includes('veg');
              const isJain = item.tags?.includes('jain');

              return (
                <Pressable
                  key={item.kitchenId}
                  style={({ pressed }) => [styles.kitchenCard, pressed && styles.kitchenCardPressed]}
                  onPress={() => onSelectKitchen(item)}
                >
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{getInitials(item.kitchenName)}</Text>
                  </View>
                  <View style={styles.kitchenInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.kitchenName}>{item.kitchenName}</Text>
                      {!!item.rating && (
                        <View style={styles.ratingTag}>
                          <Ionicons name="star-outline" size={12} color="#D97724" />
                          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.societyText}>{item.society || 'Lotus Heights'}</Text>

                    {/* Tag Pills */}
                    <View style={styles.tagPillsRow}>
                      {isVeg && (
                        <View style={styles.vegBadge}>
                          <Text style={styles.vegBadgeText}>{t('partyKitchen.pureVeg', '100% Veg')}</Text>
                        </View>
                      )}
                      {isJain && (
                        <View style={styles.jainBadge}>
                          <Text style={styles.jainBadgeText}>{t('partyKitchen.jainFriendly', 'Jain-friendly')}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.guestPriceText}>
                      {t('partyKitchen.minGuests', { defaultValue: 'Min {{count}} guests · Starting ₹{{price}}/head', count: item.minGuests, price: item.minPricePerHead })}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {visibleList.length === 0 && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#8A7A70', fontWeight: '600' }}>{t('partyKitchen.noMatch', 'No kitchens match these filters.')}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: '#FAF6F0',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: '#2C1B14',
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#2C1B14',
      marginTop: 4,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterSection: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    tagGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 12,
    },
    tagCard: {
      width: '22.5%',
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#EAE3DA',
    },
    tagCardSelected: {
      backgroundColor: '#2C1B14',
      borderColor: '#2C1B14',
    },
    tagLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#2C1B14',
      marginTop: 6,
    },
    tagLabelSelected: {
      color: '#FFFFFF',
    },
    activeFilterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
    },
    activeFilterText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#C8653B',
    },
    clearText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#8A7A70',
      textDecorationLine: 'underline',
    },
    matchCountText: {
      fontSize: 13,
      color: '#7C6E65',
      marginTop: 12,
      fontWeight: '600',
    },
    scroll: {
      flexGrow: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    kitchenCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E8E1D9',
    },
    kitchenCardPressed: {
      backgroundColor: '#FDFBF7',
      transform: [{ scale: 0.99 }],
    },
    avatarBox: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: '#F5E6D3',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#D97724',
    },
    avatarText: {
      color: '#D97724',
      fontSize: 17,
      fontWeight: '800',
    },
    kitchenInfo: {
      flex: 1,
      marginLeft: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    kitchenName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#2C1B14',
    },
    ratingTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    ratingText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#D97724',
    },
    societyText: {
      fontSize: 12,
      color: '#8A7A70',
      marginTop: 2,
    },
    tagPillsRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 6,
      marginBottom: 4,
    },
    vegBadge: {
      backgroundColor: '#EAF5EC',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    vegBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#2E7D32',
    },
    jainBadge: {
      backgroundColor: '#F7EFE5',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    jainBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#9C6D3B',
    },
    guestPriceText: {
      fontSize: 12,
      color: '#2C1B14',
      marginTop: 4,
    },
  });
