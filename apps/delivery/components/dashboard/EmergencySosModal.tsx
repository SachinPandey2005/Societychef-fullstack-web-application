import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface EmergencySosModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmSos: () => void;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  visible,
  onClose,
  onConfirmSos,
}) => {
  const { colors, spacing } = useTheme();
  const [triggered, setTriggered] = useState(false);

  const handlePressSos = () => {
    setTriggered(true);
    onConfirmSos();
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.alertIconCircle, { backgroundColor: colors.dangerContainer }]}>
          <Icon name="warning" size={36} colorType="danger" />
        </View>

        <Text variant="h3" weight="extrabold" align="center" color="danger" style={{ marginTop: spacing.sm }}>
          EMERGENCY SOS PANIC
        </Text>

        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          This will broadcast your live GPS coordinates immediately to RasoHi Ops control center and local emergency contacts.
        </Text>

        {triggered ? (
          <View style={[styles.successBox, { backgroundColor: colors.successContainer, marginTop: spacing.md }]}>
            <Text variant="xs" weight="extrabold" color="success" align="center">
              SOS Broadcast Dispatched! Ops team calling you...
            </Text>
          </View>
        ) : (
          <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
            <Button label="Cancel" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
            <Button label="Trigger SOS" onPress={handlePressSos} variant="primary" size="md" style={{ flex: 1 }} />
          </View>
        )}
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
  alertIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  successBox: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
});

export default EmergencySosModal;
