import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface NavigationBottomSheetProps {
  pickupEta?: number;
  deliveryEta?: number;
  distanceKm?: number;
  trafficDelayMins?: number;
  pickupName?: string;
  dropName?: string;
  chefPhone?: string;
  customerPhone?: string;
  destLat?: number;
  destLng?: number;
  onCallChef?: () => void;
  onCallCustomer?: () => void;
  onEmergencySos?: () => void;
}

interface NavigationBottomSheetProps {
  pickupEta?: number;
  deliveryEta?: number;
  distanceKm?: number;
  trafficDelayMins?: number;
  pickupName?: string;
  dropName?: string;
  chefPhone?: string;
  customerPhone?: string;
  destLat?: number;
  destLng?: number;
  targetStep?: 'PICKUP' | 'DROP';
  onCallChef?: () => void;
  onCallCustomer?: () => void;
  onEmergencySos?: () => void;
  onConfirmArrival?: () => void;
}

export const NavigationBottomSheet: React.FC<NavigationBottomSheetProps> = ({
  deliveryEta = 10,
  distanceKm = 2.3,
  targetStep = 'PICKUP',
  onCallChef,
  onCallCustomer,
  onEmergencySos,
  onConfirmArrival,
}) => {
  const { spacing, radius, shadows } = useTheme();

  const ctaLabel = targetStep === 'PICKUP' ? 'Reached Pickup' : 'Reached Drop';

  return (
    <View
      style={[
        styles.sheetContainer,
        {
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: radius.xxlarge,
          borderTopRightRadius: radius.xxlarge,
          padding: spacing.md + 2,
          ...shadows.xl,
        },
      ]}
    >
      <View style={styles.dragHandle} />

      {/* ETA & Distance Row */}
      <View style={styles.metricsRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="sm" weight="extrabold" style={{ color: '#0B4F3A' }}>
            ETA {deliveryEta} mins
          </Text>
          <Text variant="caption" style={{ color: '#5A6E63' }}>
            •
          </Text>
          <Text variant="sm" weight="bold" style={{ color: '#5A6E63' }}>
            {distanceKm} km
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onCallCustomer && (
            <TouchableOpacity activeOpacity={0.7} onPress={onCallCustomer} style={styles.iconBtn}>
              <Icon name="phone" size={16} color="#0B4F3A" />
            </TouchableOpacity>
          )}
          {onCallChef && (
            <TouchableOpacity activeOpacity={0.7} onPress={onCallChef} style={styles.iconBtn}>
              <Icon name="chat" size={16} color="#0B4F3A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Primary Reached Pickup / Drop Action Button */}
      <Button
        label={ctaLabel}
        onPress={onConfirmArrival || (() => {})}
        variant="primary"
        size="lg"
        fullWidth
        style={{ marginTop: spacing.md, backgroundColor: '#0B4F3A', borderRadius: radius.large }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    width: '100%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E0D5',
    alignSelf: 'center',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2ECE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NavigationBottomSheet;
