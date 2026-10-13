import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';
import { OrderDetailsFull } from '../../store/useOrderStore';

interface OrderCardProps {
  order: OrderDetailsFull;
  onPressDetails: () => void;
  onPressAction?: () => void;
  actionLabel?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPressDetails,
  onPressAction,
  actionLabel = 'Manage Delivery',
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const chefName = order.kitchen?.name || (order as any).kitchen_name || 'Home Kitchen';
  const customerAddress = (order as any).drop_address || order.customer?.full_name || 'Tower A, Apt 402';
  const societyName = (order as any).society_name || 'Green Meadows Estate';
  const distanceKm = (order as any).distance_km || 1.2;
  const orderFee = order.delivery_fee || (order as any).estimated_earnings || 65;
  const orderNumber = order.order_number || '1024';
  const rawStatus = (order.status || 'ACTIVE').toUpperCase();

  // Status mapping
  const isActive = rawStatus === 'ACTIVE' || rawStatus === 'ACCEPTED' || rawStatus === 'IN_TRANSIT' || rawStatus === 'PICKED_UP';
  const isCompleted = rawStatus === 'COMPLETED' || rawStatus === 'DELIVERED';
  const isCancelled = rawStatus === 'CANCELLED';

  const cardBorderColor = isActive ? '#0B4F3A' : isCancelled ? '#FCA5A5' : colors.border;
  const cardBgColor = isCompleted ? '#F8FAF8' : isCancelled ? '#FFF5F5' : '#FFFFFF';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressDetails}
      style={[
        styles.card,
        {
          backgroundColor: cardBgColor,
          borderRadius: radius.large,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderColor: cardBorderColor,
          borderWidth: isActive ? 2 : 1,
          ...shadows.sm,
        },
      ]}
    >
      {/* Header Row: Delivery #, Status Chip */}
      <View style={styles.headerRow}>
        <Text variant="sm" weight="extrabold" style={{ color: isActive ? '#0B4F3A' : colors.text }}>
          Delivery #{orderNumber}
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isActive
                ? '#E2ECE7'
                : isCompleted
                ? '#E2ECE7'
                : isCancelled
                ? '#FEE2E2'
                : '#FEF3C7',
            },
          ]}
        >
          <Text
            variant="caption"
            weight="extrabold"
            style={{
              color: isActive
                ? '#0B4F3A'
                : isCompleted
                ? '#0B4F3A'
                : isCancelled
                ? '#DC2626'
                : '#D97706',
              fontSize: 10,
            }}
          >
            {isCompleted ? '✓ Completed' : isCancelled ? '⚠ Cancelled' : isActive ? 'Active' : 'Upcoming'}
          </Text>
        </View>
      </View>

      {/* Pickup & Drop Address Layout */}
      <View style={[styles.locationGrid, { marginTop: spacing.sm }]}>
        <View style={styles.locationLine}>
          <Icon name="storefront" size={14} colorType="primary" />
          <View style={{ marginLeft: 6, flex: 1 }}>
            <Text variant="caption" color="muted" style={{ fontSize: 10 }}>
              Pickup
            </Text>
            <Text variant="xs" weight="bold" numberOfLines={1} style={{ color: colors.text }}>
              {chefName} ({societyName})
            </Text>
          </View>
        </View>

        <View style={{ paddingLeft: 4, marginVertical: 1 }}>
          <Text variant="caption" style={{ color: colors.primary, fontWeight: 'bold' }}>↓</Text>
        </View>

        <View style={styles.locationLine}>
          <Icon name="home" size={14} colorType="secondary" />
          <View style={{ marginLeft: 6, flex: 1 }}>
            <Text variant="caption" color="muted" style={{ fontSize: 10 }}>
              Drop
            </Text>
            <Text variant="xs" weight="bold" numberOfLines={1} style={{ color: colors.text }}>
              {customerAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer Meta Row: Distance, Earnings, Time */}
      <View style={[styles.footerRow, { marginTop: spacing.sm }]}>
        <Text variant="caption" color="secondary" weight="semibold">
          {distanceKm} km • 15 mins
        </Text>

        <Text variant="sm" weight="extrabold" style={{ color: '#0B4F3A' }}>
          Earning: ₹{orderFee}
        </Text>
      </View>

      {isActive && (
        <Button
          label={actionLabel}
          onPress={onPressAction || onPressDetails}
          variant="primary"
          size="sm"
          fullWidth
          style={{ marginTop: spacing.sm, backgroundColor: '#0B4F3A' }}
        />
      )}
    </TouchableOpacity>
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationGrid: {
    gap: 2,
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default OrderCard;
