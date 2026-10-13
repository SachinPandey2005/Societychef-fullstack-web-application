import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Modal } from '../ui/Modal';
import { Icon } from '../Icon';

interface QuickMessageModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMessage: (msg: string) => void;
}

export const QuickMessageModal: React.FC<QuickMessageModalProps> = ({
  visible,
  onClose,
  onSelectMessage,
}) => {
  const { colors, spacing, radius } = useTheme();

  const presets = [
    'I have arrived at your building entrance / security gate.',
    'I am picking up your order from the chef kitchen now.',
    'Slight traffic delay, estimated arrival in 5 minutes.',
    'Please come down to Gate 2 to collect your package.',
    'Order has been placed outside your door as requested.',
  ];

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="h3" weight="extrabold" align="center">
          In-App Quick Messages
        </Text>
        <Text variant="xs" color="secondary" align="center" style={{ marginTop: 4 }}>
          Tap to send instant update to resident or chef.
        </Text>

        <View style={[styles.list, { marginTop: spacing.md }]}>
          {presets.map((msg, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => {
                onSelectMessage(msg);
                onClose();
              }}
              style={[
                styles.msgItem,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: radius.medium,
                  padding: spacing.sm,
                },
              ]}
            >
              <Icon name="chat" size={16} colorType="primary" />
              <Text variant="xs" weight="medium" style={{ marginLeft: 8, flex: 1 }}>
                "{msg}"
              </Text>
            </TouchableOpacity>
          ))}
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
  list: {
    gap: 8,
  },
  msgItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default QuickMessageModal;
