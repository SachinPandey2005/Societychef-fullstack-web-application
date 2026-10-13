import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { OrderItemDetail } from '../../store/useOrderStore';

interface OrderDetailsCardProps {
  items?: OrderItemDetail[];
  specialInstructions?: string;
  allergyInfo?: string;
  cookingInstructions?: string;
  packagingNotes?: string;
}

export const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({
  items = [],
  specialInstructions,
  allergyInfo,
  cookingInstructions,
  packagingNotes,
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
      <View style={styles.headerRow}>
        <Icon name="list" size={18} colorType="primary" />
        <Text variant="sm" weight="extrabold" style={{ marginLeft: spacing.xs }}>
          Order Items Checklist ({items.length})
        </Text>
      </View>

      <View style={[styles.itemList, { marginTop: spacing.xs }]}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Icon name="check-box" size={16} colorType="primary" />
            <Text variant="xs" weight="bold" style={{ marginLeft: 6, flex: 1 }}>
              {item.quantity}x {item.dishes?.name || 'Gourmet Dish Item'}
            </Text>
            {item.dishes?.price && (
              <Text variant="xs" color="secondary">
                ₹{item.dishes.price * item.quantity}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Special & Allergy Instructions */}
      {allergyInfo ? (
        <View style={[styles.alertBox, { backgroundColor: colors.dangerContainer, marginTop: spacing.xs }]}>
          <Icon name="warning" size={14} colorType="danger" />
          <Text variant="caption" weight="bold" color="danger" style={{ marginLeft: 4 }}>
            Allergy Alert: {allergyInfo}
          </Text>
        </View>
      ) : null}

      {cookingInstructions ? (
        <View style={[styles.noteBox, { backgroundColor: colors.surfaceElevated, marginTop: spacing.xs }]}>
          <Text variant="caption" weight="bold" color="secondary">
            Chef Cooking Notes: {cookingInstructions}
          </Text>
        </View>
      ) : null}

      {packagingNotes ? (
        <View style={[styles.noteBox, { backgroundColor: colors.infoContainer, marginTop: spacing.xs }]}>
          <Text variant="caption" weight="bold" color="info">
            Packaging: {packagingNotes}
          </Text>
        </View>
      ) : null}
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
  },
  itemList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
  },
  noteBox: {
    padding: 6,
    borderRadius: 6,
  },
});

export default OrderDetailsCard;
