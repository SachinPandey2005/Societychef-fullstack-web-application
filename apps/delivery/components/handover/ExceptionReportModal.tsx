import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { TextInput } from '../ui/TextInput';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';
import { IssueType } from '../../store/useIssueStore';

interface ExceptionReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitIssue: (issueType: IssueType, notes: string) => Promise<void>;
}

export const ExceptionReportModal: React.FC<ExceptionReportModalProps> = ({
  visible,
  onClose,
  onSubmitIssue,
}) => {
  const { colors, spacing, radius } = useTheme();
  const [selectedIssue, setSelectedIssue] = useState<IssueType>('CUSTOMER_UNAVAILABLE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issues: { label: string; value: IssueType; icon: string }[] = [
    { label: 'Customer Unreachable / Not Available', value: 'CUSTOMER_UNAVAILABLE', icon: 'person-off' },
    { label: 'Society Guard Denied Entry to Gate', value: 'BUILDING_ACCESS_DENIED', icon: 'security' },
    { label: 'Invalid / Wrong Drop Address', value: 'WRONG_ADDRESS', icon: 'location-off' },
    { label: 'Food Package Damaged in Transit', value: 'PACKAGE_DAMAGED', icon: 'warning' },
    { label: 'Missing Food Items from Kitchen', value: 'ORDER_MISSING_ITEMS', icon: 'inventory' },
    { label: 'Other Operational Exception', value: 'OTHER', icon: 'help-outline' },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitIssue(selectedIssue, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="h3" weight="extrabold" align="center">
          Report Delivery Exception
        </Text>
        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Select the issue type to alert CRM dispatch & request immediate assistance.
        </Text>

        <View style={[styles.issuesList, { marginTop: spacing.md }]}>
          {issues.map((item) => {
            const isSelected = selectedIssue === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.8}
                onPress={() => setSelectedIssue(item.value)}
                style={[
                  styles.issueRow,
                  {
                    backgroundColor: isSelected ? colors.dangerContainer : colors.surfaceElevated,
                    borderColor: isSelected ? colors.danger : colors.border,
                    borderRadius: radius.medium,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Icon
                  name={item.icon as any}
                  size={18}
                  colorType={isSelected ? 'danger' : 'secondary'}
                />
                <Text
                  variant="xs"
                  weight={isSelected ? 'bold' : 'medium'}
                  color={isSelected ? 'danger' : 'secondary'}
                  style={{ marginLeft: 8, flex: 1 }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ width: '100%', marginTop: spacing.md }}>
          <TextInput
            label="Additional Notes / Details"
            value={notes}
            onChangeText={setNotes}
            placeholder="Describe the issue for CRM dispatcher..."
          />
        </View>

        <View style={[styles.actionsRow, { marginTop: spacing.md }]}>
          <Button label="Cancel" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
          <Button
            label="Submit Ticket"
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
  issuesList: {
    gap: 6,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default ExceptionReportModal;
