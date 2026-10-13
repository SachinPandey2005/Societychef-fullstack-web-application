import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { IconButton } from '../ui/IconButton';
import { Icon } from '../Icon';

interface AddressCardProps {
  kitchenName?: string;
  chefName?: string;
  pickupAddress?: string;
  chefPhone?: string;
  customerName?: string;
  dropAddress?: string;
  customerPhone?: string;
  onCallChef?: () => void;
  onCallCustomer?: () => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  kitchenName = 'Chef Kitchen',
  chefName = 'Home Chef',
  pickupAddress = 'Kitchen Address',
  customerName = 'Resident',
  dropAddress = 'Drop Address',
  onCallChef,
  onCallCustomer,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

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
      <Text variant="xs" weight="extrabold" color="secondary" style={{ marginBottom: spacing.xs }}>
        Pickup & Delivery Addresses
      </Text>

      {/* Pickup Block */}
      <View style={styles.blockRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.successContainer }]}>
          <Icon name="storefront" size={18} colorType="success" />
        </View>

        <View style={styles.addressMeta}>
          <Text variant="caption" color="muted">
            PICKUP KITCHEN
          </Text>
          <Text variant="xs" weight="bold">
            {kitchenName} ({chefName})
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={2}>
            {pickupAddress}
          </Text>
        </View>

        {onCallChef && <IconButton name="phone" onPress={onCallChef} accessibilityLabel="Call Chef" />}
      </View>

      <View style={[styles.verticalDashedLine, { borderColor: colors.border }]} />

      {/* Drop Block */}
      <View style={styles.blockRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.infoContainer }]}>
          <Icon name="home" size={18} colorType="info" />
        </View>

        <View style={styles.addressMeta}>
          <Text variant="caption" color="muted">
            DROP RESIDENT
          </Text>
          <Text variant="xs" weight="bold">
            {customerName}
          </Text>
          <Text variant="caption" color="secondary" numberOfLines={2}>
            {dropAddress}
          </Text>
        </View>

        {onCallCustomer && <IconButton name="phone" onPress={onCallCustomer} accessibilityLabel="Call Resident" />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressMeta: {
    flex: 1,
    marginLeft: 10,
  },
  verticalDashedLine: {
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    height: 18,
    marginLeft: 16,
    marginVertical: 4,
  },
});

export default AddressCard;
