import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface CancellationNoticeCardProps {
  orderNumber?: string;
  reason?: string;
  compensationAmount?: number;
  onAcknowledge: () => void;
}

export const CancellationNoticeCard: React.FC<CancellationNoticeCardProps> = ({
  orderNumber = 'ORD-9821',
  reason = 'Customer cancelled order due to delay',
  compensationAmount = 45,
  onAcknowledge,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.danger,
          borderWidth: 1.5,
          borderRadius: radius.large,
          padding: spacing.md,
          marginTop: spacing.md,
          ...shadows.sm,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Icon name="warning" size={24} colorType="danger" />
        <Text variant="sm" weight="extrabold" color="danger" style={{ marginLeft: spacing.xs }}>
          Order Cancelled During Delivery
        </Text>
      </View>

      <Text variant="xs" weight="bold" style={{ marginTop: spacing.xs }}>
        Order #{orderNumber}
      </Text>

      <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
        Reason: {reason}
      </Text>

      <View style={[styles.compBox, { backgroundColor: colors.successContainer, marginTop: spacing.xs }]}>
        <Text variant="caption" weight="bold" color="success">
          Partner Cancellation Compensation Fee: ₹{compensationAmount} (Credited to Wallet)
        </Text>
      </View>

      <Text variant="caption" color="muted" style={{ marginTop: spacing.xs }}>
        Next Steps: Please dispose of or return package according to CRM instructions.
      </Text>

      <Button
        label="Acknowledge & Continue"
        onPress={onAcknowledge}
        variant="primary"
        size="md"
        style={{ width: '100%', marginTop: spacing.md }}
      />
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
  compBox: {
    padding: 6,
    borderRadius: 6,
  },
});

export default CancellationNoticeCard;
