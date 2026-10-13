import React, { useEffect, useRef } from 'react';
import { Modal, View, Pressable, Animated, StyleSheet, Dimensions, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { IconButton } from './IconButton';

export interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  closeOnBackdropPress?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  closeOnBackdropPress = true,
  style,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  // Slide animation value
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        {/* Backdrop Touch Dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdropPress ? handleClose : undefined}
          accessibilityLabel="Close bottom drawer"
        />

        <Animated.View
          style={[
            styles.sheetContent,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.large,
              borderTopRightRadius: radius.large,
              padding: spacing.md,
              paddingBottom: spacing.xxl + 16,
              transform: [{ translateY: slideAnim }],
              ...shadows.xl,
            },
            style as any,
          ]}
          accessibilityRole="none"
        >
          {/* Draggable indicator line */}
          <View style={[styles.dragBar, { backgroundColor: colors.border }]} />

          {/* Header */}
          {(title || onClose) && (
            <View style={[styles.header, { marginBottom: spacing.md }]}>
              {title ? (
                <Text variant="md" weight="bold">
                  {title}
                </Text>
              ) : (
                <View />
              )}
              {onClose && (
                <IconButton
                  name="close"
                  onPress={handleClose}
                  size={20}
                  accessibilityLabel="Close drawer button"
                />
              )}
            </View>
          )}

          {/* Slots children */}
          <View>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)', // 50% opacity slate
    justifyContent: 'flex-end',
  },
  sheetContent: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default BottomSheet;
