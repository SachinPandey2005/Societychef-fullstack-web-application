import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';

export interface RadioButtonProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onSelect,
  label,
  disabled = false,
  style,
}) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          styles.outerCircle,
          {
            borderColor: selected ? colors.primary : colors.border,
            borderWidth: 2,
            borderRadius: radius.pill,
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        {selected && (
          <View
            style={[
              styles.innerCircle,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
              },
            ]}
          />
        )}
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
  outerCircle: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 10,
    height: 10,
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default RadioButton;
