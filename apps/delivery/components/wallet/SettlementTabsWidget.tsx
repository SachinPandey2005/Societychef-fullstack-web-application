import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { SettlementItem, SettlementTabType } from '../../store/useSettlementStore';

interface SettlementTabsWidgetProps {
  activeTab: SettlementTabType;
  settlements: SettlementItem[];
  onSelectTab: (tab: SettlementTabType) => void;
  onSelectSettlement: (id: string) => void;
}

export const SettlementTabsWidget: React.FC<SettlementTabsWidgetProps> = ({
  activeTab,
  settlements,
  onSelectTab,
  onSelectSettlement,
}) => {
  const { colors, radius, shadows } = useTheme();

  const mockSettlement: SettlementItem = settlements[0] || {
    id: 'SET-1029',
    partner_id: 'DP-001',
    settlement_period: '22 Jul 2026 - 28 Jul 2026',
    total_gross_earnings: 5800,
    total_deductions: 150,
    net_amount: 5650,
    orders_included_count: 42,
    status: 'PAID',
    payout_date: '2026-07-29',
    crm_settlement_batch_id: 'BATCH-881',
    bank_reference_number: 'HDFC998231',
  };

  const getChipStyle = (tabVal: SettlementTabType, isSelected: boolean) => {
    switch (tabVal) {
      case 'PAID':
        return {
          bg: isSelected ? '#0B4F3A' : '#E6F4EA',
          text: isSelected ? '#FFFFFF' : '#059669',
        };
      case 'PROCESSING':
        return {
          bg: isSelected ? '#D97706' : '#FEF3C7',
          text: isSelected ? '#FFFFFF' : '#D97706',
        };
      case 'PENDING':
        return {
          bg: isSelected ? '#2563EB' : '#EFF6FF',
          text: isSelected ? '#FFFFFF' : '#2563EB',
        };
      case 'REJECTED':
        return {
          bg: isSelected ? '#EF4444' : '#FEE2E2',
          text: isSelected ? '#FFFFFF' : '#EF4444',
        };
    }
  };

  const tabs: { label: string; value: SettlementTabType }[] = [
    { label: 'Paid', value: 'PAID' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 16,
          marginVertical: 6,
          borderColor: '#E2E8F0',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      {/* 1. Header Row: Title & Calendar Icon Badge */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <Icon name="sync" size={16} color="#059669" />
          <Text variant="sm" weight="extrabold" numberOfLines={1} style={{ color: '#0F172A', marginLeft: 6, fontSize: 13, flexShrink: 1 }}>
            Ops CRM Settlement Cycles
          </Text>
        </View>

        <View style={styles.calendarGraphicCircle}>
          <Icon name="event" size={20} color="#059669" />
        </View>
      </View>

      {/* 2. Full-Width Filter Chips Row */}
      <View style={styles.tabsRow}>
        {tabs.map((t) => {
          const isSelected = activeTab === t.value;
          const chipTheme = getChipStyle(t.value, isSelected);
          return (
            <TouchableOpacity
              key={t.value}
              activeOpacity={0.8}
              onPress={() => onSelectTab(t.value)}
              style={[
                styles.tabChip,
                {
                  backgroundColor: chipTheme.bg,
                },
              ]}
            >
              <Text
                variant="caption"
                weight="extrabold"
                numberOfLines={1}
                style={{ color: chipTheme.text, fontSize: 10.5, textAlign: 'center' }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Cycle Item Details */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectSettlement(mockSettlement.id)}
        style={styles.settlementRow}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="calendar-today" size={14} color="#64748B" />
          <Text variant="xs" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6 }}>
            {mockSettlement.settlement_period}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <Text variant="caption" style={{ color: '#64748B', fontSize: 11 }}>
              Orders: {mockSettlement.orders_included_count} • Net Amount:{' '}
            </Text>
            <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
              ₹{mockSettlement.net_amount}
            </Text>
          </View>

          <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11, marginLeft: 8, flexShrink: 0 }}>
            Paid ›
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarGraphicCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 12,
  },
  tabChip: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});

export default SettlementTabsWidget;
