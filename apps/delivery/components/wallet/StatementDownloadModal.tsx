import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../Icon';

interface StatementDownloadModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StatementDownloadModal: React.FC<StatementDownloadModalProps> = ({ visible, onClose }) => {
  const { colors, spacing, radius } = useTheme();
  const [selectedRange, setSelectedRange] = useState<'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH'>('THIS_MONTH');

  const options: { label: string; value: 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' }[] = [
    { label: 'This Week Statement', value: 'THIS_WEEK' },
    { label: 'This Month Statement (Jul 2026)', value: 'THIS_MONTH' },
    { label: 'Last Month Statement (Jun 2026)', value: 'LAST_MONTH' },
  ];

  const handleDownload = () => {
    const url = `https://societychef.app/statements/statement_${selectedRange.toLowerCase()}.pdf`;
    Linking.openURL(url).catch((err) => console.warn('Could not open statement link:', err));
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: colors.infoContainer }]}>
          <Icon name="description" size={32} colorType="info" />
        </View>

        <Text variant="h3" weight="extrabold" align="center" style={{ marginTop: spacing.sm }}>
          Download Financial Statement
        </Text>
        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Generate itemized PDF receipt and tax summary statement.
        </Text>

        <View style={[styles.optionsGroup, { marginTop: spacing.md }]}>
          {options.map((opt) => {
            const isSelected = selectedRange === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.8}
                onPress={() => setSelectedRange(opt.value)}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected ? colors.infoContainer : colors.surfaceElevated,
                    borderColor: isSelected ? colors.info : colors.border,
                    borderRadius: radius.medium,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Icon
                  name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={18}
                  colorType={isSelected ? 'info' : 'secondary'}
                />
                <Text variant="xs" weight={isSelected ? 'bold' : 'medium'} style={{ marginLeft: 8, flex: 1 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.actionsRow, { marginTop: spacing.lg }]}>
          <Button label="Cancel" onPress={onClose} variant="outline" size="md" style={{ flex: 1 }} />
          <Button label="Download PDF" onPress={handleDownload} variant="primary" size="md" style={{ flex: 2 }} />
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
  optionsGroup: {
    width: '100%',
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
});

export default StatementDownloadModal;
