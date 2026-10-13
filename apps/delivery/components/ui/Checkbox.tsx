import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

export interface CheckboxProps {
  checked: boolean;
  onValueChange: (newValue: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onValueChange,
  label,
  disabled = false,
  style,
}) => {
  const { colors, spacing, radius } = useTheme();

  const toggle = () => {
    if (!disabled) {
      onValueChange(!checked);
    }
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={toggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderRadius: radius.small,
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : 'transparent',
            borderWidth: checked ? 0 : 2,
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        {checked && <Icon name="check" size={16} color="#FFFFFF" />}
      </View>
      {label && (
        <Text
          variant="sm"
          color={disabled ? 'muted' : 'default'}
          style={[styles.label, { marginLeft: spacing.sm }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default Checkbox;
