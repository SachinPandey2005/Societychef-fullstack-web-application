import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface SwitchProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  style?: ViewStyle;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  activeColor,
  style,
}) => {
  const { colors, radius } = useTheme();
  // Animation value for position
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // color/width animations don't support native driver
    }).start();
  }, [value, animatedValue]);

  const toggle = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  // Interpolate slide position
  const translateValue = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22], // 20px travel distance
  });

  // Interpolate background color
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, activeColor || colors.primary],
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[
        styles.switchContainer,
        {
          borderRadius: radius.pill,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor, borderRadius: radius.pill }]} />
      <Animated.View
        style={[
          styles.switchBall,
          {
            backgroundColor: '#FFFFFF',
            borderRadius: radius.pill,
            transform: [{ translateX: translateValue }],
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2.5,
              },
              android: {
                elevation: 1.5,
              },
            }),
          },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    width: 48,
    height: 28,
    position: 'relative',
    justifyContent: 'center',
  },
  switchBall: {
    width: 24,
    height: 24,
  },
});

export default Switch;
