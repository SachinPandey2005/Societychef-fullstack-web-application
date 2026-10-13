import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/Icon';
import { useFAQStore } from '../../../store/useFAQStore';
import { FAQRepository } from '../../../repositories/FAQRepository';

const CATEGORIES = [
  'ALL',
  'ORDER_PROCESS',
  'PICKUP',
  'DELIVERY',
  'PAYMENTS',
  'WALLET',
  'APP_USAGE',
  'SAFETY',
];

export default function FAQScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { filteredFaqs, searchQuery, isLoading } = useFAQStore();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    FAQRepository.fetchFaqs();
  }, []);

  const handleRefresh = async () => {
    await FAQRepository.fetchFaqs(activeCategory === 'ALL' ? undefined : activeCategory);
  };

  const handleSearchChange = (text: string) => {
    FAQRepository.search(text);
  };

  const handleCategorySelect = async (cat: string) => {
    setActiveCategory(cat);
    await FAQRepository.fetchFaqs(cat === 'ALL' ? undefined : cat);
  };

  const toggleExpand = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">FAQ & Knowledge Base</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceContainer, borderRadius: radius.large }]}>
          <Icon name="search" size={20} color={colors.textSecondary} containerStyle={{ marginLeft: spacing.sm }} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search help articles..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {/* Category Pills Horizontal Scroll List */}
      <View style={[styles.pillsContainer, { paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = activeCategory === item;
            return (
              <Pressable
                onPress={() => handleCategorySelect(item)}
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                    borderRadius: radius.large,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  weight="bold"
                  style={{ color: isSelected ? '#FFFFFF' : colors.textSecondary }}
                >
                  {item.replace('_', ' ')}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <Card key={faq.id} style={{ padding: spacing.md }} onPress={() => toggleExpand(faq.id)}>
                <View style={styles.faqHeader}>
                  <Text variant="caption" weight="bold" style={{ flex: 1, paddingRight: 8 }}>
                    {faq.question}
                  </Text>
                  <Icon
                    name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>

                {isExpanded && (
                  <View style={{ marginTop: spacing.sm }}>
                    <View style={[styles.divider, { backgroundColor: colors.outlineVariant, marginBottom: spacing.xs }]} />
                    <Text variant="caption" color="secondary" style={{ lineHeight: 18 }}>
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}

          {filteredFaqs.length === 0 && (
            <Text variant="caption" color="secondary" align="center" style={{ paddingVertical: spacing.xl }}>
              No matching help articles found.
            </Text>
          )}

        </View>
      </ScrollableLayout>
    </ScreenWrapper>
  );
}

// React Native FlatList import fix
import { FlatList } from 'react-native';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    width: '100%',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 13,
    paddingRight: 12,
  },
  pillsContainer: {
    width: '100%',
  },
  pillBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
