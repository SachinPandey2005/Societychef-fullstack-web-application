import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface RejectionReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmReject: (reason: string) => void;
}

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  visible,
  onClose,
  onConfirmReject,
}) => {
  const { colors, spacing, radius } = useTheme();
  const [selectedReason, setSelectedReason] = useState('TOO_FAR');

  const reasons = [
    { label: 'Pickup / Drop Location Too Far', value: 'TOO_FAR' },
    { label: 'Vehicle / Breakdown Issue', value: 'VEHICLE_ISSUE' },
    { label: 'Heavy Traffic Congestion', value: 'TRAFFIC' },
    { label: 'Personal Emergency', value: 'PERSONAL_EMERGENCY' },
    { label: 'Other Reason', value: 'OTHER' },
  ];

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="h3" weight="extrabold" align="center">
          Decline Assignment
        </Text>
        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Please select a reason to help CRM dispatch another partner immediately.
        </Text>

        <View style={[styles.optionsList, { marginTop: spacing.md }]}>
          {reasons.map((r) => {
            const isSelected = selectedReason === r.value;
            return (
              <TouchableOpacity
                key={r.value}
                activeOpacity={0.8}
                onPress={() => setSelectedReason(r.value)}
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: isSelected ? colors.infoContainer : colors.surfaceElevated,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radius.medium,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Icon
                  name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={18}
                  colorType={isSelected ? 'primary' : 'secondary'}
                />
                <Text variant="xs" weight={isSelected ? 'bold' : 'medium'} style={{ marginLeft: 8, flex: 1 }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
          <Button label="Cancel" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
          <Button
            label="Confirm Reject"
            onPress={() => onConfirmReject(selectedReason)}
            variant="primary"
            size="md"
            style={{ flex: 1 }}
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
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default RejectionReasonModal;
