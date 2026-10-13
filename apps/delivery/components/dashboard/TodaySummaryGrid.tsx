import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { TodaySummaryData } from '../../store/useDashboardStore';

interface TodaySummaryGridProps {
  summary: TodaySummaryData | null;
}

export const TodaySummaryGrid: React.FC<TodaySummaryGridProps> = ({ summary }) => {
  const { colors, radius, shadows } = useTheme();

  const todayEarnings = summary?.today_earnings ?? 4250;
  const todayDeliveries = summary?.today_deliveries ?? 12;
  const activeHours = (summary as any)?.active_hours || '6h 30m';
  const totalDistance = (summary as any)?.total_distance_km || '28.4 km';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 14,
          borderColor: '#E2E8F0',
          borderWidth: 1,
          ...shadows.xs,
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Icon name="calendar-today" size={14} color="#059669" />
        <Text variant="caption" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6, fontSize: 12 }}>
          Today's Performance
        </Text>
      </View>

      {/* Amount & Wallet Graphic Row */}
      <View style={styles.amountRow}>
        <View style={{ flex: 1 }}>
          <Text variant="h2" weight="extrabold" style={{ color: '#059669', fontSize: 24 }}>
            ₹{todayEarnings.toLocaleString()}
          </Text>
          <Text variant="caption" style={{ color: '#64748B', fontSize: 10, marginTop: 1 }}>
            Today's Earnings
          </Text>
        </View>

        <View style={styles.walletCircle}>
          <Icon name="account-balance-wallet" size={24} color="#059669" />
        </View>
      </View>

      <View style={styles.divider} />

      {/* 3-Column Bottom Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="shopping-bag" size={12} color="#059669" />
            <Text variant="caption" weight="extrabold" numberOfLines={1} style={{ color: '#0F172A', marginLeft: 3, fontSize: 10.5 }}>
              {todayDeliveries}
            </Text>
          </View>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9, marginTop: 2, textAlign: 'center' }}>
            Deliveries
          </Text>
        </View>

        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="schedule" size={12} color="#059669" />
            <Text variant="caption" weight="extrabold" numberOfLines={1} style={{ color: '#0F172A', marginLeft: 3, fontSize: 10.5 }}>
              {activeHours}
            </Text>
          </View>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9, marginTop: 2, textAlign: 'center' }}>
            Online
          </Text>
        </View>

        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="alt-route" size={12} color="#059669" />
            <Text variant="caption" weight="extrabold" numberOfLines={1} style={{ color: '#0F172A', marginLeft: 3, fontSize: 10.5 }}>
              {totalDistance}
            </Text>
          </View>
          <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9, marginTop: 2, textAlign: 'center' }}>
            Distance
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  walletCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    flexShrink: 1,
  },
});

export default TodaySummaryGrid;
