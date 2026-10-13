import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';
import { usePickupStore, PickupChecklistState } from '../../store/usePickupStore';

interface PickupChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmChecklist: () => void;
}

export const PickupChecklistModal: React.FC<PickupChecklistModalProps> = ({
  visible,
  onClose,
  onConfirmChecklist,
}) => {
  const { colors, spacing, radius } = useTheme();
  const { checklist, setChecklistItem } = usePickupStore();

  const items: { label: string; key: keyof PickupChecklistState }[] = [
    { label: 'Food Package Received from Chef', key: 'foodPackageReceived' },
    { label: 'Correct Items & Quantity Count Verified', key: 'correctQuantity' },
    { label: 'Thermal Packaging Intact', key: 'packagingIntact' },
    { label: 'Hygiene & Tamper Seal Intact', key: 'sealIntact' },
    { label: 'Temperature Check Verified (Hot/Cold)', key: 'temperatureChecked' },
    { label: 'Special Instructions Reviewed', key: 'instructionsVerified' },
  ];

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="h3" weight="extrabold" align="center">
          Kitchen Pickup Checklist
        </Text>
        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Please verify all items with the chef before confirming pickup.
        </Text>

        <View style={[styles.checklistGroup, { marginTop: spacing.md }]}>
          {items.map((item) => {
            const isChecked = checklist[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                onPress={() => setChecklistItem(item.key, !isChecked)}
                style={[
                  styles.checkRow,
                  {
                    backgroundColor: isChecked ? colors.successContainer : colors.surfaceElevated,
                    borderColor: isChecked ? colors.success : colors.border,
                    borderRadius: radius.medium,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Icon
                  name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  colorType={isChecked ? 'success' : 'secondary'}
                />
                <Text
                  variant="xs"
                  weight={isChecked ? 'bold' : 'medium'}
                  color={isChecked ? 'success' : 'secondary'}
                  style={{ marginLeft: 8, flex: 1 }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <Button label="Cancel" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
          <Button
            label="Confirm Checklist"
            onPress={onConfirmChecklist}
            disabled={!allChecked}
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
  checklistGroup: {
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default PickupChecklistModal;
