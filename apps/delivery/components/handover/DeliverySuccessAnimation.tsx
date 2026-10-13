import React from 'react';
import { View, StyleSheet, Modal as RNModal } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface DeliverySuccessAnimationProps {
  visible: boolean;
  orderNumber?: string;
  earningsFee?: number;
  onDone: () => void;
}

export const DeliverySuccessAnimation: React.FC<DeliverySuccessAnimationProps> = ({
  visible,
  orderNumber = 'ORD-9821',
  earningsFee = 95,
  onDone,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  if (!visible) return null;

  return (
    <RNModal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.large,
              padding: spacing.lg,
              borderColor: colors.success,
              borderWidth: 2,
              ...shadows.xl,
            },
          ]}
        >
          {/* Success Check Circle */}
          <View style={[styles.successCircle, { backgroundColor: colors.success }]}>
            <Icon name="check" size={44} color="#FFFFFF" />
          </View>

          <Text variant="h2" weight="extrabold" align="center" style={{ marginTop: spacing.md }}>
            Delivery Completed!
          </Text>

          <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
            Order #{orderNumber} handed over to resident successfully.
          </Text>

          <View style={[styles.earningsBox, { backgroundColor: colors.successContainer, marginTop: spacing.md }]}>
            <Text variant="caption" color="muted">
              DELIVERY FEE EARNED
            </Text>
            <Text variant="h1" weight="extrabold" color="success">
              + ₹{earningsFee}
            </Text>
          </View>

          <Button
            label="Back to Orders Queue"
            onPress={onDone}
            variant="primary"
            size="lg"
            style={{ width: '100%', marginTop: spacing.lg }}
          />
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
});

export default DeliverySuccessAnimation;
