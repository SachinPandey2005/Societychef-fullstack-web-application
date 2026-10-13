import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from './Button';

export interface SnackBarProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
  onDismiss: () => void;
  duration?: number;
  style?: ViewStyle;
}

export const SnackBar: React.FC<SnackBarProps> = ({
  visible,
  message,
  actionLabel,
  onActionPress,
  onDismiss,
  duration = 4000,
  style,
}) => {
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  // Slide animation value
  const slideAnim = useRef(new Animated.Value(100)).current;
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E293B' : '#0F172A', // Slate 900 for high contrast
          borderRadius: radius.medium,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          transform: [{ translateY: slideAnim }],
          ...shadows.lg,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text variant="xs" color="white" style={styles.messageText}>
          {message}
        </Text>
        <View style={styles.actionContainer}>
          {actionLabel && onActionPress && (
            <Button
              label={actionLabel}
              onPress={() => {
                onActionPress();
                handleDismiss();
              }}
              variant="ghost"
              size="sm"
              labelStyle={{ color: colors.secondary }}
              style={styles.actionBtn}
            />
          )}
          <Pressable
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss snackbar"
            style={styles.dismissBtn}
          >
            <Text variant="xs" weight="semibold" style={{ color: '#FFFFFF' }}>
              ✕
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  messageText: {
    flex: 1,
    paddingRight: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    minWidth: 50,
    paddingHorizontal: 8,
  },
  dismissBtn: {
    padding: 8,
    marginLeft: 8,
  },
});

export default SnackBar;
