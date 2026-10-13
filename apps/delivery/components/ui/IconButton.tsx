import React from 'react';
import { Pressable, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Icon, IconName } from '../Icon';

export type IconButtonVariant = 'filled' | 'outlined' | 'ghost';

export interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: number;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  onPress,
  variant = 'ghost',
  size = 24,
  disabled = false,
  loading = false,
  color,
  style,
  testID,
  accessibilityLabel,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();

  // Resolve styles
  let bgStyle: ViewStyle = {};
  let borderStyle: ViewStyle = {};
  let resolvedColor = color || colors.text;

  const paddingVal = spacing.sm;
  const targetSize = size + paddingVal * 2;

  switch (variant) {
    case 'filled':
      bgStyle = { backgroundColor: isDark ? '#334155' : '#E2E8F0' };
      break;
    case 'outlined':
      borderStyle = { borderWidth: 1, borderColor: colors.border };
      break;
    case 'ghost':
      bgStyle = { backgroundColor: 'transparent' };
      break;
  }

  if (disabled) {
    resolvedColor = colors.textMuted;
    bgStyle = variant === 'filled' ? { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' } : {};
    borderStyle = variant === 'outlined' ? { borderColor: colors.divider } : {};
  }

  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        {
          width: targetSize,
          height: targetSize,
          borderRadius: radius.pill,
        },
        bgStyle,
        borderStyle,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={resolvedColor} size="small" />
      ) : (
        <Icon name={name} size={size} color={resolvedColor} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});

export default IconButton;
