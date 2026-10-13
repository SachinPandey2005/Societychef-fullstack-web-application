import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Text } from '../../components/Typography';
import { TextInput } from '../../components/ui/TextInput';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';

// Stores & Repositories
import { useOrderStore } from '../../store/useOrderStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { OrderRepository } from '../../repositories/OrderRepository';
import { HistoryRepository } from '../../repositories/HistoryRepository';

// Order Components
import {
  OrderQueueTabs,
  OrderCard,
  OrderFilterModal,
  QueueTabType,
} from '../../components/orders';

export default function OrdersScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const { ordersList, activeTab, setActiveTab, isLoading } = useOrderStore();
  const { historyList, filters, setFilters, resetFilters } = useHistoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    if (activeTab === 'COMPLETED' || activeTab === 'CANCELLED') {
      HistoryRepository.fetchHistory();
    } else {
      OrderRepository.fetchOrders(activeTab);
    }
  }, [activeTab]);

  const handleRefresh = useCallback(async () => {
    if (activeTab === 'COMPLETED' || activeTab === 'CANCELLED') {
      await HistoryRepository.fetchHistory();
    } else {
      await OrderRepository.fetchOrders(activeTab);
    }
    showToast('Orders queue updated', 'info');
  }, [activeTab]);

  const handleSelectTab = (tab: QueueTabType) => {
    setActiveTab(tab);
  };

  // Filtered dataset by active queue tab & search query
  const currentDataset = activeTab === 'COMPLETED' || activeTab === 'CANCELLED' ? historyList : ordersList;
  const filteredData = currentDataset.filter((item: any) => {
    const rawStatus = (item.status || '').toUpperCase();

    // 1. Strict Status Queue Filter
    if (activeTab === 'CANCELLED') {
      if (rawStatus !== 'CANCELLED' && rawStatus !== 'REJECTED') {
        return false;
      }
    } else if (activeTab === 'COMPLETED') {
      if (rawStatus !== 'COMPLETED' && rawStatus !== 'DELIVERED') {
        return false;
      }
    } else if (activeTab === 'AVAILABLE') {
      if (rawStatus !== 'AVAILABLE' && rawStatus !== 'ASSIGNED') {
        return false;
      }
    } else if (activeTab === 'ACTIVE') {
      if (rawStatus === 'DELIVERED' || rawStatus === 'COMPLETED' || rawStatus === 'CANCELLED' || rawStatus === 'REJECTED') {
        return false;
      }
    }

    // 2. Search Query Matching
    const q = searchQuery.toLowerCase();
    const matchesNumber = item.order_number?.toLowerCase().includes(q);
    const matchesKitchen = item.kitchen_name?.toLowerCase().includes(q) || item.kitchen?.name?.toLowerCase().includes(q);
    const matchesCustomer = item.customer_name?.toLowerCase().includes(q) || item.customer?.full_name?.toLowerCase().includes(q);
    return !q || matchesNumber || matchesKitchen || matchesCustomer;
  });

  return (
    <ScreenWrapper>
      {/* Title & Search Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text variant="md" weight="extrabold">
          Order Management Queue
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setFilterModalVisible(true)}
          style={[styles.filterBtn, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}
        >
          <Icon name="filter-list" size={18} colorType="primary" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search order #, chef or resident..."
          leftIcon="search"
        />

        <OrderQueueTabs
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />
      </View>

      {/* List / Skeleton / Empty State */}
      {isLoading && filteredData.length === 0 ? (
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <View style={{ height: 110, backgroundColor: colors.surfaceContainer, borderRadius: radius.large }} />
          <View style={{ height: 110, backgroundColor: colors.surfaceContainer, borderRadius: radius.large }} />
          <View style={{ height: 110, backgroundColor: colors.surfaceContainer, borderRadius: radius.large }} />
        </View>
      ) : (
        <FlatList
          data={filteredData as any[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inventory" size={48} colorType="secondary" />
              <Text variant="sm" weight="extrabold" style={{ marginTop: spacing.sm, color: colors.text }}>
                No active deliveries
              </Text>
              <Text variant="caption" color="secondary" align="center" style={{ marginTop: 2 }}>
                Your next delivery will appear here.
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleRefresh}
                style={{ marginTop: spacing.md, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E2ECE7', borderRadius: 20 }}
              >
                <Text variant="caption" weight="extrabold" style={{ color: '#0B4F3A' }}>
                  Refresh Queue ↻
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPressDetails={() => router.push(`/(orders)/${item.id}`)}
              onPressAction={() => router.push(`/(orders)/${item.id}`)}
              actionLabel={activeTab === 'AVAILABLE' ? 'Accept Order' : 'Manage Delivery'}
            />
          )}
        />
      )}

      {/* History Filter Modal */}
      <OrderFilterModal
        visible={filterModalVisible}
        filters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          HistoryRepository.fetchHistory();
          showToast('History filters applied', 'success');
        }}
        onReset={() => {
          resetFilters();
          HistoryRepository.fetchHistory();
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
});
