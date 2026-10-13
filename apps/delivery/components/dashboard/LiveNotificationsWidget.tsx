import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { NotificationItem } from '../../store/useDashboardStore';

interface LiveNotificationsWidgetProps {
  notifications: NotificationItem[];
}

export const LiveNotificationsWidget: React.FC<LiveNotificationsWidgetProps> = ({ notifications }) => {
  const { colors, spacing, radius, shadows } = useTheme();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'ORDER_ASSIGNED':
        return 'inventory';
      case 'BONUS':
        return 'card-giftcard';
      case 'SHIFT_REMINDER':
        return 'schedule';
      case 'PAYMENT_UPDATE':
        return 'credit-card';
      case 'KYC_UPDATE':
        return 'check-circle';
      default:
        return 'notifications';
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.large,
          padding: spacing.md,
          marginTop: spacing.md,
          ...shadows.sm,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="notifications" size={18} colorType="primary" />
          <Text variant="sm" weight="extrabold" style={{ marginLeft: spacing.xs }}>
            Live Notifications
          </Text>
        </View>
        <Text variant="caption" weight="bold" color="primary">
          {notifications.length} Recent
        </Text>
      </View>

      <View style={[styles.list, { marginTop: spacing.xs }]}>
        {notifications.slice(0, 4).map((n) => (
          <View
            key={n.id}
            style={[
              styles.item,
              {
                backgroundColor: n.read ? colors.surfaceElevated : colors.infoContainer,
                borderRadius: radius.medium,
                padding: spacing.sm,
              },
            ]}
          >
            <View style={styles.itemHeader}>
              <Icon name={getIconForType(n.type) as any} size={14} colorType="primary" />
              <Text variant="xs" weight="bold" style={{ marginLeft: 6, flex: 1 }}>
                {n.title}
              </Text>
              {!n.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </View>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              {n.message}
            </Text>
          </View>
        ))}
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
  list: {
    gap: 6,
  },
  item: {
    width: '100%',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default LiveNotificationsWidget;
