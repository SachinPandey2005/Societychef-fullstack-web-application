import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';

export interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  colorType?: 'primary' | 'secondary';
  label?: string;
  style?: ViewStyle;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  colorType = 'primary',
  label,
  style,
}) => {
  const { colors, spacing, isDark } = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerSize = size === 'large' ? 44 : 24;
  const color = colorType === 'primary' ? colors.primary : colors.secondary;

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderRadius: spinnerSize / 2,
            borderWidth: size === 'large' ? 4 : 2.5,
            borderColor: isDark ? '#334155' : '#E2E8F0',
            borderTopColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
      {label && (
        <Text
          variant={size === 'large' ? 'sm' : 'xs'}
          weight="medium"
          color="secondary"
          style={{ marginTop: spacing.sm }}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderStyle: 'solid',
  },
});

export default LoadingIndicator;
