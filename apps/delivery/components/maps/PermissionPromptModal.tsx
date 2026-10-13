import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface PermissionPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onGrantPermissions: () => void;
}

export const PermissionPromptModal: React.FC<PermissionPromptModalProps> = ({
  visible,
  onClose,
  onGrantPermissions,
}) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.infoContainer }]}>
          <Icon name="location-on" size={36} colorType="info" />
        </View>

        <Text variant="h3" weight="extrabold" align="center" style={{ marginTop: spacing.sm }}>
          Location & GPS Permissions
        </Text>

        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          RasoHi requires continuous high-accuracy location tracking to route your deliveries efficiently and update CRM & customers in real time.
        </Text>

        <View style={[styles.permList, { marginTop: spacing.md }]}>
          <View style={styles.permRow}>
            <Icon name="check-circle" size={16} colorType="success" />
            <Text variant="caption" weight="bold" style={{ marginLeft: 6 }}>
              Foreground GPS Location
            </Text>
          </View>
          <View style={styles.permRow}>
            <Icon name="check-circle" size={16} colorType="success" />
            <Text variant="caption" weight="bold" style={{ marginLeft: 6 }}>
              Background Location Tracking (While App Minimized)
            </Text>
          </View>
          <View style={styles.permRow}>
            <Icon name="check-circle" size={16} colorType="success" />
            <Text variant="caption" weight="bold" style={{ marginLeft: 6 }}>
              Battery Saver Exemption (Prevent background sleep)
            </Text>
          </View>
        </View>

        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <Button label="Later" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
          <Button
            label="Grant Permissions"
            onPress={() => {
              onGrantPermissions();
              onClose();
            }}
            variant="primary"
            size="md"
            style={{ flex: 2 }}
          />
        </View>
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
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permList: {
    width: '100%',
    gap: 8,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
});

export default PermissionPromptModal;
