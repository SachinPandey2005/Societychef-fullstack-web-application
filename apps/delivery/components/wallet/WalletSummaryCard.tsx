import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { WalletSummary } from '../../store/useWalletStore';

interface WalletSummaryCardProps {
  summary: WalletSummary | null;
  onRequestPayout: () => void;
  selectedPeriod?: 'TODAY' | 'WEEK' | 'MONTH';
  onSelectPeriod?: (period: 'TODAY' | 'WEEK' | 'MONTH') => void;
}

export const WalletSummaryCard: React.FC<WalletSummaryCardProps> = ({
  summary,
  onRequestPayout,
  selectedPeriod = 'WEEK',
  onSelectPeriod,
}) => {
  const { colors, radius, shadows } = useTheme();

  const [period, setPeriod] = React.useState<'TODAY' | 'WEEK' | 'MONTH'>(selectedPeriod);

  React.useEffect(() => {
    if (selectedPeriod) {
      setPeriod(selectedPeriod);
    }
  }, [selectedPeriod]);

  const handlePeriodChange = (newPeriod: 'TODAY' | 'WEEK' | 'MONTH') => {
    setPeriod(newPeriod);
    if (onSelectPeriod) {
      onSelectPeriod(newPeriod);
    }
  };

  // Dynamic metrics mapped to active time period (Today / This Week / This Month)
  const periodMetrics = {
    TODAY: {
      amount: (summary as any)?.today_earnings ?? 680,
      deliveries: (summary as any)?.today_deliveries ?? 3,
      onlineTime: (summary as any)?.today_online_hours ?? '2h 15m',
      distanceKm: (summary as any)?.today_distance ?? '8.4 km',
    },
    WEEK: {
      amount: summary?.available_balance ?? 4250,
      deliveries: (summary as any)?.week_deliveries ?? 18,
      onlineTime: (summary as any)?.week_online_hours ?? '6h 45m',
      distanceKm: (summary as any)?.week_distance ?? '24.2 km',
    },
    MONTH: {
      amount: (summary as any)?.month_earnings ?? 18600,
      deliveries: (summary as any)?.month_deliveries ?? 74,
      onlineTime: (summary as any)?.month_online_hours ?? '32h 10m',
      distanceKm: (summary as any)?.month_distance ?? '112.5 km',
    },
  };

  const activeMetrics = periodMetrics[period] || periodMetrics.WEEK;
  const available = activeMetrics.amount;
  const deliveries = activeMetrics.deliveries;
  const onlineTime = activeMetrics.onlineTime;
  const distanceKm = activeMetrics.distanceKm;

  return (
    <View
      style={[
        styles.card,
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
      {/* Top Header: YOUR EARNINGS + Withdraw Pill */}
      <View style={styles.topHeader}>
        <Text variant="caption" weight="extrabold" style={{ color: '#64748B', letterSpacing: 0.8, fontSize: 11 }}>
          YOUR EARNINGS
        </Text>

        <TouchableOpacity activeOpacity={0.8} onPress={onRequestPayout} style={styles.withdrawBtn}>
          <Icon name="account-balance-wallet" size={14} color="#059669" />
          <Text variant="caption" weight="extrabold" style={{ color: '#059669', marginLeft: 4, fontSize: 11 }}>
            Withdraw
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Body: Amount & Rupee Wallet Graphic */}
      <View style={styles.bodyRow}>
        <View style={styles.amountCol}>
          <Text variant="h1" weight="extrabold" style={{ color: '#059669', fontSize: 34 }}>
            ₹{available.toLocaleString()}
          </Text>

          {/* Period Selector Chips */}
          <View style={styles.periodRow}>
            {[
              { label: 'Today', value: 'TODAY' },
              { label: 'This Week', value: 'WEEK' },
              { label: 'This Month', value: 'MONTH' },
            ].map((p) => {
              const isSelected = period === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  activeOpacity={0.7}
                  onPress={() => handlePeriodChange(p.value as any)}
                  style={[
                    styles.periodPill,
                    {
                      backgroundColor: isSelected ? '#0B4F3A' : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    weight={isSelected ? 'extrabold' : 'bold'}
                    style={{ color: isSelected ? '#FFFFFF' : '#64748B', fontSize: 11 }}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Right Graphic: Wallet & Rupee Stack */}
        <View style={styles.walletGraphicCircle}>
          <Icon name="account-balance-wallet" size={36} color="#059669" />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom 3-Column Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="two-wheeler" size={16} color="#059669" />
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6 }}>
              {deliveries}
            </Text>
          </View>
          <Text variant="caption" style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>
            Deliveries
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="schedule" size={16} color="#059669" />
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6 }}>
              {onlineTime}
            </Text>
          </View>
          <Text variant="caption" style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>
            Online Time
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="place" size={16} color="#059669" />
            <Text variant="sm" weight="extrabold" style={{ color: '#0F172A', marginLeft: 6 }}>
              {distanceKm}
            </Text>
          </View>
          <Text variant="caption" style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>
            Distance
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  amountCol: {
    flex: 1,
  },
  walletGraphicCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
});

export default WalletSummaryCard;
