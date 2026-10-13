import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  flex?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  flex = false,
  icon,
}: ButtonProps) {
  const Colors = useThemeStore((s) => s.colors);
  const styles = getStyles(Colors);
  const containerStyle: ViewStyle[] = [
    styles.base,
    getVariantContainerStyles(Colors)[variant],
    flex && styles.flex,
    (disabled || loading) && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  return (
    <Pressable
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : Colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon != null && icon}
          <Text style={[styles.label, getVariantTextStyles(Colors)[variant]]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  flex: {
    flex: 1,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 15,
    fontWeight: '900',
  },
});

const getVariantContainerStyles = (Colors: any): Record<Variant, ViewStyle> => ({
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const getVariantTextStyles = (Colors: any): Record<Variant, object> => ({
  primary: { color: '#ffffff' },
  secondary: { color: Colors.dark },
  ghost: { color: Colors.primary },
});
