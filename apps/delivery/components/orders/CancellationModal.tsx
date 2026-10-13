import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface CancellationModalProps {
  visible: boolean;
  orderNumber?: string;
  reason?: string;
  onClose: () => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  visible,
  orderNumber = 'ORD-0000',
  reason = 'Cancelled by CRM Dispatcher',
  onClose,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.dangerContainer }]}>
          <Icon name="warning" size={36} colorType="danger" />
        </View>

        <Text variant="h3" weight="extrabold" align="center" color="danger" style={{ marginTop: spacing.sm }}>
          Order Cancelled
        </Text>

        <Text variant="xs" weight="bold" color="primary" align="center" style={{ marginTop: 4 }}>
          Order #{orderNumber}
        </Text>

        <Text variant="xs" color="secondary" align="center" style={{ marginTop: spacing.xs }}>
          Reason: {reason}
        </Text>

        <Text variant="caption" color="muted" align="center" style={{ marginTop: spacing.xs }}>
          Please stop delivery progress. Your assignment state has been updated.
        </Text>

        <Button
          label="Acknowledge"
          onPress={onClose}
          variant="primary"
          size="md"
          style={{ width: '100%', marginTop: spacing.md }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CancellationModal;
