import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { ActiveDeliveryData } from '../../store/useDashboardStore';

interface ActiveDeliveryCardProps {
  activeDelivery: ActiveDeliveryData | null;
  onResumeDelivery?: () => void;
}

export const ActiveDeliveryCard: React.FC<ActiveDeliveryCardProps> = ({
  activeDelivery,
  onResumeDelivery,
}) => {
  const { colors, radius, shadows } = useTheme();

  const kitchenName = activeDelivery?.kitchen_name || 'Green Meadows Kitchen';
  const dropAddress = activeDelivery?.drop_address || 'Tower B • Flat 402';
  const earnings = (activeDelivery as any)?.estimated_earnings || 145;
  const distance = (activeDelivery as any)?.distance_km || 2.8;
  const orderNum = activeDelivery?.order_number || 'SC1024';

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
      {/* Header Row: Title & View -> */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 6 }}>
          <Icon name="inventory-2" size={14} color="#059669" />
          <Text variant="caption" weight="extrabold" numberOfLines={1} style={{ color: '#0F172A', marginLeft: 4, fontSize: 11.5, flexShrink: 1 }}>
            Active Delivery
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={onResumeDelivery} style={{ flexShrink: 0 }}>
          <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
            View →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tag Badge */}
      <View style={styles.tagBadge}>
        <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 10 }}>
          #{orderNum}
        </Text>
      </View>

      {/* Main Row: Route Timeline on Left, Rider Graphic on Right */}
      <View style={styles.bodyRow}>
        <View style={styles.routeCol}>
          {/* Pickup */}
          <View style={styles.routeRow}>
            <View style={styles.greenDot} />
            <View style={{ marginLeft: 6 }}>
              <Text variant="caption" weight="extrabold" style={{ color: '#0F172A', fontSize: 11 }}>
                {kitchenName}
              </Text>
              <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9 }}>
                Core Campus
              </Text>
            </View>
          </View>

          {/* Dotted Vertical Line */}
          <View style={styles.vertLine} />

          {/* Drop */}
          <View style={styles.routeRow}>
            <View style={styles.redDot} />
            <View style={{ marginLeft: 6 }}>
              <Text variant="caption" weight="extrabold" style={{ color: '#0F172A', fontSize: 11 }}>
                {dropAddress}
              </Text>
              <Text variant="caption" style={{ color: '#94A3B8', fontSize: 9 }}>
                Customer Location
              </Text>
            </View>
          </View>
        </View>

        {/* Scooter Rider Illustration */}
        <View style={styles.riderCircle}>
          <Icon name="two-wheeler" size={28} color="#059669" />
        </View>
      </View>

      {/* Price & Distance Pill */}
      <View style={styles.pricePill}>
        <Text variant="caption" weight="extrabold" style={{ color: '#059669', fontSize: 11 }}>
          ₹{earnings} • {distance} km
        </Text>
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
    justifyContent: 'space-between',
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  routeCol: {
    flex: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  vertLine: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginLeft: 3.5,
    marginVertical: 2,
  },
  riderCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
});

export default ActiveDeliveryCard;
