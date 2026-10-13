import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { GeofenceStatus } from '../../store/useTrackingStore';

interface GeofenceAlertBannerProps {
  status: GeofenceStatus;
  distanceMeters?: number;
  onConfirmArrival?: () => void;
}

export const GeofenceAlertBanner: React.FC<GeofenceAlertBannerProps> = ({
  status,
  distanceMeters = 45,
  onConfirmArrival,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  if (status === 'OUTSIDE_RADIUS') return null;

  const isKitchen = status === 'KITCHEN_ARRIVED' || status === 'APPROACHING_KITCHEN';
  const isArrived = status === 'KITCHEN_ARRIVED' || status === 'CUSTOMER_ARRIVED';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isArrived ? colors.successContainer : colors.infoContainer,
          borderColor: isArrived ? colors.success : colors.info,
          borderRadius: radius.medium,
          padding: spacing.sm,
          ...shadows.sm,
        },
      ]}
    >
      <Icon
        name={isArrived ? 'check-circle' : 'navigation'}
        size={22}
        colorType={isArrived ? 'success' : 'info'}
      />

      <View style={styles.textMeta}>
        <Text variant="xs" weight="extrabold" color={isArrived ? 'success' : 'info'}>
          {isArrived
            ? isKitchen
              ? 'Arrived at Kitchen Radius!'
              : 'Arrived at Customer Resident Gate!'
            : isKitchen
            ? 'Approaching Chef Kitchen'
            : 'Approaching Customer Destination'}
        </Text>
        <Text variant="caption" color="secondary" style={{ marginTop: 1 }}>
          Distance: ~{distanceMeters}m away from target.
        </Text>
      </View>

      {isArrived && onConfirmArrival && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onConfirmArrival}
          style={[styles.confirmBtn, { backgroundColor: colors.success, borderRadius: radius.small }]}
        >
          <Text variant="caption" weight="extrabold" style={{ color: '#FFFFFF' }}>
            Confirm Arrival
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    marginVertical: 8,
  },
  textMeta: {
    flex: 1,
    marginLeft: 10,
  },
  confirmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

export default GeofenceAlertBanner;
