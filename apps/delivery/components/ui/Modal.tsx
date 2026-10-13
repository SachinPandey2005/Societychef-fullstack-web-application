import React from 'react';
import { Modal as RNModal, View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { IconButton } from './IconButton';

export interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  closeOnBackdropPress?: boolean;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  closeOnBackdropPress = true,
  style,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Backdrop Press Dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdropPress ? onClose : undefined}
          accessibilityLabel="Close dialog"
        />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.large,
              padding: spacing.md,
              ...shadows.xl,
            },
            style,
          ]}
          accessibilityRole="none"
        >
          {/* Header Row */}
          {(title || onClose) && (
            <View style={[styles.header, { marginBottom: spacing.md }]}>
              {title ? (
                <Text variant="md" weight="bold" style={styles.title}>
                  {title}
                </Text>
              ) : (
                <View />
              )}
              {onClose && (
                <IconButton
                  name="close"
                  onPress={onClose}
                  size={20}
                  accessibilityLabel="Close modal button"
                />
              )}
            </View>
          )}

          {/* Children View */}
          <View>{children}</View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // 60% Slate 900
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});

export default Modal;
