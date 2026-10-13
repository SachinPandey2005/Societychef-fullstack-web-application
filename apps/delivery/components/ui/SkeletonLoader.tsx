import React from 'react';
import { Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useShimmerPulse } from '../../animations';

export type SkeletonShape = 'rect' | 'circle' | 'square';

export interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  shape?: SkeletonShape;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  shape = 'rect',
  style,
}) => {
  const { colors, radius, isDark } = useTheme();
  const shimmerValue = useShimmerPulse(1200);

  // Determine border radius based on shape
  let resolvedRadius: number = radius.small;
  if (shape === 'circle') {
    resolvedRadius = typeof width === 'number' ? width / 2 : 9999;
  } else if (shape === 'square') {
    resolvedRadius = radius.medium;
  }

  const skeletonColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height: shape === 'circle' && typeof width === 'number' ? width : height,
          borderRadius: resolvedRadius,
          backgroundColor: skeletonColor,
          opacity: shimmerValue,
        } as any,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

export default SkeletonLoader;
