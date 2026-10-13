import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { TextInput } from '../ui/TextInput';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface ChefPinVerifyModalProps {
  visible: boolean;
  onClose: () => void;
  onVerifyPin: (pin: string) => Promise<void>;
  isLoading?: boolean;
}

export const ChefPinVerifyModal: React.FC<ChefPinVerifyModalProps> = ({
  visible,
  onClose,
  onVerifyPin,
  isLoading = false,
}) => {
  const { colors, spacing, radius } = useTheme();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setErrorMsg('Please enter a valid 4-digit Chef PIN');
      return;
    }

    try {
      setErrorMsg(null);
      await onVerifyPin(pin);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Invalid Chef PIN. Please check with kitchen.');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.infoContainer }]}>
          <Icon name="verified-user" size={32} colorType="primary" />
        </View>

        <Text variant="h3" weight="extrabold" align="center" style={{ marginTop: spacing.sm }}>
          Chef Pickup Handover
        </Text>
        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Ask the Home Chef for their 4-digit Pickup PIN or scan QR code.
        </Text>

        <View style={{ width: '100%', marginTop: spacing.md }}>
          <TextInput
            label="Chef 4-Digit Pickup PIN"
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="e.g. 1234"
            error={errorMsg || undefined}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPin('1234')}
          style={[styles.qrSimBtn, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}
        >
          <Icon name="qr-code-scanner" size={18} colorType="secondary" />
          <Text variant="caption" weight="bold" style={{ marginLeft: 6 }}>
            Scan Chef Handover QR Code (Auto-Fill)
          </Text>
        </TouchableOpacity>

        <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
          <Button label="Back" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
          <Button
            label="Verify Pickup"
            onPress={handleSubmit}
            loading={isLoading}
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
});

export default ChefPinVerifyModal;
