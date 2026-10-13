import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal } from './Modal';
import { Text } from '../Typography';
import { Button } from './Button';
import { useTheme } from '../../theme/ThemeContext';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'primary' | 'danger';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary',
  loading = false,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <Modal visible={visible} onClose={onCancel}>
      <View style={styles.content}>
        <Text variant="md" weight="extrabold" style={{ color: colors.text, textAlign: 'center' }}>
          {title}
        </Text>

        <Text
          variant="xs"
          style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg }}
        >
          {description}
        </Text>

        <View style={styles.actionsRow}>
          <Button
            label={cancelLabel}
            onPress={onCancel}
            variant="outline"
            size="md"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            loading={loading}
            disabled={loading}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    width: '100%',
    padding: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});

export default ConfirmationModal;
