import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface SafetySosModalProps {
  visible: boolean;
  onClose: () => void;
  onTriggerSos: () => Promise<void>;
  onCallOps: () => void;
  onCallPolice: () => void;
}

export const SafetySosModal: React.FC<SafetySosModalProps> = ({
  visible,
  onClose,
  onTriggerSos,
  onCallOps,
  onCallPolice,
}) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.sosCircle, { backgroundColor: colors.danger }]}>
          <Icon name="warning" size={40} color="#FFFFFF" />
        </View>

        <Text variant="h2" weight="extrabold" align="center" color="danger" style={{ marginTop: spacing.sm }}>
          EMERGENCY SOS
        </Text>

        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Triggering SOS will broadcast your live location to Ops Control & emergency contacts.
        </Text>

        <Button
          label="TRIGGER LIVE SOS ALERT"
          onPress={async () => {
            await onTriggerSos();
            onClose();
          }}
          variant="danger"
          size="lg"
          style={{ width: '100%', marginTop: spacing.md }}
        />

        <View style={[styles.shortcutsRow, { marginTop: spacing.md }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onCallOps}
            style={[styles.shortcutBtn, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}
          >
            <Icon name="phone" size={18} colorType="primary" />
            <Text variant="caption" weight="bold" style={{ marginLeft: 6 }}>
              Call Ops Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onCallPolice}
            style={[styles.shortcutBtn, { backgroundColor: colors.dangerContainer, borderRadius: radius.medium }]}
          >
            <Icon name="security" size={18} colorType="danger" />
            <Text variant="caption" weight="bold" color="danger" style={{ marginLeft: 6 }}>
              Call Helpline (112)
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          label="Cancel"
          onPress={onClose}
          variant="outline"
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
    padding: 16,
    alignItems: 'center',
  },
  sosCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});

export default SafetySosModal;
