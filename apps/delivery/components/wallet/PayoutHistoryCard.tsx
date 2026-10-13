import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { PayoutHistoryItem } from '../../store/usePayoutStore';

interface PayoutHistoryCardProps {
  payouts: PayoutHistoryItem[];
}

export const PayoutHistoryCard: React.FC<PayoutHistoryCardProps> = ({ payouts }) => {
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
          borderColor: colors.border,
          borderWidth: 1,
          ...shadows.sm,
        },
      ]}
    >
      <Text variant="xs" weight="extrabold" color="secondary" style={{ marginBottom: spacing.xs }}>
        Payout History & Digital Receipts
      </Text>

      <View style={styles.list}>
        {payouts.map((p) => (
          <View
            key={p.id}
            style={[
              styles.payoutItem,
              {
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.medium,
                padding: spacing.sm,
              },
            ]}
          >
            <View style={styles.itemHeader}>
              <View>
                <Text variant="xs" weight="bold">
                  ₹{p.amount.toLocaleString()} ({p.payment_method})
                </Text>
                <Text variant="caption" color="muted">
                  Ref: {p.reference_number}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL(p.receipt_url).catch(err => console.warn(err))}
                style={[styles.receiptBtn, { backgroundColor: colors.infoContainer, borderRadius: radius.small }]}
              >
                <Icon name="description" size={14} colorType="info" />
                <Text variant="caption" weight="bold" color="info" style={{ marginLeft: 4 }}>
                  Receipt
                </Text>
              </TouchableOpacity>
            </View>
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
  list: {
    gap: 8,
  },
  payoutItem: {
    width: '100%',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

export default PayoutHistoryCard;
