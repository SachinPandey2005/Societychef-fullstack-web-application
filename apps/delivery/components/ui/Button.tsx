import React, { memo, useRef, useCallback } from 'react';
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon, IconName } from '../Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = memo(({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  labelStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors, spacing, radius, isDark, opacity: themeOpacity } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Resolve backgrounds
  let bgColor = colors.primary;
  let textColor: string = '#FFFFFF';
  let borderStyle: ViewStyle = {};

  switch (variant) {
    case 'primary':
      bgColor = colors.primary;
      textColor = colors.onPrimary;
      break;
    case 'secondary':
      bgColor = colors.secondary;
      textColor = colors.onSecondary;
      break;
    case 'success':
      bgColor = colors.success;
      textColor = colors.onSuccess;
      break;
    case 'danger':
      bgColor = colors.danger;
      textColor = colors.onDanger;
      break;
    case 'outline':
      bgColor = 'transparent';
      borderStyle = { borderWidth: 1.5, borderColor: colors.primary };
      textColor = colors.primary;
      break;
    case 'ghost':
      bgColor = 'transparent';
      textColor = colors.primary;
      break;
  }

  // Handle disabled state
  if (disabled) {
    bgColor = colors.surfaceContainerHigh;
    borderStyle = {};
    textColor = colors.textMuted;
  }

  // Resolve sizes
  let paddingH: number = spacing.xl;
  let paddingV: number = spacing.md;
  let textVariant: 'xs' | 'sm' | 'md' = 'md';
  let iconSize = 20;
  let minHeight = 48;

  switch (size) {
    case 'sm':
      paddingH = spacing.lg;
      paddingV = spacing.sm;
      textVariant = 'xs';
      iconSize = 16;
      minHeight = 44;
      break;
    case 'md':
      paddingH = spacing.xl;
      paddingV = spacing.md;
      textVariant = 'sm';
      iconSize = 18;
      minHeight = 48;
      break;
    case 'lg':
      paddingH = spacing.xxl;
      paddingV = spacing.lg;
      textVariant = 'md';
      iconSize = 20;
      minHeight = 54;
      break;
  }

  // Press animation + haptics
  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [disabled, loading]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }, [disabled, loading]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    // Light haptic on press
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  }, [disabled, loading, onPress]);

  const buttonStyle: ViewStyle = {
    backgroundColor: bgColor,
    paddingHorizontal: paddingH,
    paddingVertical: paddingV,
    borderRadius: radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight,
    gap: spacing.sm,
    ...borderStyle,
    ...(fullWidth ? { width: '100%' } : {}),
  };

  // Map text color to a TextColor type for our Typography component
  const resolveTextColorProp = (): 'white' | 'primary' | 'muted' => {
    if (disabled) return 'muted';
    if (variant === 'outline' || variant === 'ghost') return 'primary';
    return 'white';
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }]}>
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading }}
        style={({ pressed }) => [
          buttonStyle,
          pressed && { opacity: 1 - themeOpacity.pressed },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {leftIcon && (
              <Icon name={leftIcon} size={iconSize} color={textColor} />
            )}
            <Text
              variant={textVariant}
              weight="semibold"
              color={resolveTextColorProp()}
              style={[{ color: textColor }, labelStyle]}
            >
              {label}
            </Text>
            {rightIcon && (
              <Icon name={rightIcon} size={iconSize} color={textColor} />
            )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
});

Button.displayName = 'Button';

export const PrimaryButton: React.FC<ButtonProps> = (props) => <Button {...props} variant="primary" />;
export const SecondaryButton: React.FC<ButtonProps> = (props) => <Button {...props} variant="secondary" />;

export default Button;
