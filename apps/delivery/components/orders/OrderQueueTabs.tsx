import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';

export type QueueTabType = 'AVAILABLE' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface OrderQueueTabsProps {
  activeTab: QueueTabType;
  onSelectTab: (tab: QueueTabType) => void;
  counts?: Record<QueueTabType, number>;
}

export const OrderQueueTabs: React.FC<OrderQueueTabsProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  const { spacing, radius } = useTheme();

  const tabs: { label: string; value: QueueTabType; badge?: number }[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Upcoming', value: 'AVAILABLE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tabs.map((t) => {
          const isSelected = activeTab === t.value;
          const count = counts ? counts[t.value] : t.badge;

          return (
            <TouchableOpacity
              key={t.value}
              activeOpacity={0.7}
              onPress={() => onSelectTab(t.value)}
              style={[
                styles.tabChip,
                {
                  backgroundColor: isSelected ? '#0B4F3A' : '#FFFFFF',
                  borderRadius: radius.pill,
                  borderColor: isSelected ? '#0B4F3A' : '#E5E0D5',
                },
              ]}
            >
              <Text
                variant="caption"
                weight={isSelected ? 'bold' : 'semibold'}
                style={{ color: isSelected ? '#FFFFFF' : '#5A6E63' }}
              >
                {t.label}
              </Text>
              {count ? (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isSelected ? '#E2ECE7' : '#0B4F3A' },
                  ]}
                >
                  <Text
                    variant="caption"
                    weight="extrabold"
                    style={{ color: isSelected ? '#0B4F3A' : '#FFFFFF', fontSize: 10 }}
                  >
                    {count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 2,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
});

export default OrderQueueTabs;
