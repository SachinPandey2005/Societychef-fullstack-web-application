import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { TextInput } from '../ui/TextInput';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PayoutRequestModalProps {
  visible: boolean;
  availableBalance: number;
  onClose: () => void;
  onRequestPayout: (amount: number) => Promise<void>;
  isSubmitting?: boolean;
}

export const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  visible,
  availableBalance = 4250,
  onClose,
  onRequestPayout,
  isSubmitting = false,
}) => {
  const { colors, spacing, radius } = useTheme();
  const [amount, setAmount] = useState('1000');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePreset = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = async () => {
    const num = Number(amount);
    if (isNaN(num) || num < 100) {
      setErrorMsg('Minimum payout request is ₹100');
      return;
    }
    if (num > availableBalance) {
      setErrorMsg(`Cannot exceed available balance (₹${availableBalance})`);
      return;
    }

    try {
      setErrorMsg(null);
      await onRequestPayout(num);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Payout request failed');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="h3" weight="extrabold" align="center">
          Request Payout Transfer
        </Text>
        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Available Balance: ₹{availableBalance.toLocaleString()} (Min Request ₹100)
        </Text>

        <View style={{ width: '100%', marginTop: spacing.md }}>
          <TextInput
            label="Payout Amount (₹)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="Enter amount"
            error={errorMsg || undefined}
          />
        </View>

        {/* Amount Presets */}
        <View style={styles.presetsRow}>
          {[500, 1000, 2000, 4000].map((preset) => (
            <TouchableOpacity
              key={preset}
              activeOpacity={0.7}
              onPress={() => handlePreset(preset)}
              style={[
                styles.presetChip,
                {
                  backgroundColor: Number(amount) === preset ? colors.primary : colors.surfaceElevated,
                  borderRadius: radius.pill,
                  borderColor: Number(amount) === preset ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                variant="caption"
                weight={Number(amount) === preset ? 'bold' : 'medium'}
                style={{ color: Number(amount) === preset ? '#FFF' : colors.textSecondary }}
              >
                ₹{preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="caption" color="muted" align="center" style={{ marginTop: spacing.xs }}>
          Request will be submitted to Ops CRM Finance Module for instant approval.
        </Text>

        <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
          <Button label="Cancel" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
          <Button
            label="Submit Request"
            onPress={handleSubmit}
            loading={isSubmitting}
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
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default PayoutRequestModal;
