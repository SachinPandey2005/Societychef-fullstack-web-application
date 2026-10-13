import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { ShiftInfo } from '../../store/useShiftStore';

interface ShiftManagementCardProps {
  shift: ShiftInfo | null;
}

export const ShiftManagementCard: React.FC<ShiftManagementCardProps> = ({ shift }) => {
  const { spacing, radius, shadows } = useTheme();

  const title = shift?.title || 'Morning Prime';
  const hoursWorked = shift?.hours_worked ? `${shift.hours_worked}h 15m` : '2h 15m';
  const breakMins = shift?.break_time_minutes ? `${shift.break_time_minutes}m` : '15m';
  const ordersCount = (shift as any)?.orders_count ?? 6;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderRadius: radius.xxlarge,
          padding: spacing.md + 4,
          marginTop: spacing.md,
          ...shadows.sm,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text variant="caption" style={{ color: '#5A6E63', fontWeight: '600' }}>
          Active Shift
        </Text>
        <View style={styles.ongoingBadge}>
          <Text variant="caption" weight="bold" style={{ color: '#0B4F3A', fontSize: 11 }}>
            Ongoing
          </Text>
        </View>
      </View>

      <Text variant="sm" weight="extrabold" style={{ color: '#0B4F3A', marginTop: 4 }}>
        {title}
      </Text>
      <Text variant="caption" style={{ color: '#5A6E63', marginTop: 2 }}>
        08:00 AM - 12:00 PM
      </Text>

      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text variant="caption" style={{ color: '#5A6E63' }}>
            Worked
          </Text>
          <Text variant="sm" weight="extrabold" style={{ color: '#0B4F3A', marginTop: 2 }}>
            {hoursWorked}
          </Text>
        </View>

        <View style={styles.metricCol}>
          <Text variant="caption" style={{ color: '#5A6E63' }}>
            Break
          </Text>
          <Text variant="sm" weight="extrabold" style={{ color: '#0B4F3A', marginTop: 2 }}>
            {breakMins}
          </Text>
        </View>

        <View style={styles.metricCol}>
          <Text variant="caption" style={{ color: '#5A6E63' }}>
            Orders
          </Text>
          <Text variant="sm" weight="extrabold" style={{ color: '#0B4F3A', marginTop: 2 }}>
            {ordersCount}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ongoingBadge: {
    backgroundColor: '#E2ECE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEBE0',
  },
  metricCol: {
    flex: 1,
  },
});

export default ShiftManagementCard;
