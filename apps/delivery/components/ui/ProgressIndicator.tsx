import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';

export interface ProgressIndicatorProps {
  progress: number; // Value between 0 and 1
  showPercentage?: boolean;
  colorType?: 'primary' | 'secondary' | 'success';
  style?: ViewStyle;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  showPercentage = false,
  colorType = 'primary',
  style,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();

  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  // Color mapping
  let barColor = colors.primary;
  switch (colorType) {
    case 'secondary':
      barColor = colors.secondary;
      break;
    case 'success':
      barColor = colors.success;
      break;
  }

  return (
    <View style={[styles.container, style]}>
      {showPercentage && (
        <Text variant="xs" weight="semibold" align="right" style={[styles.percentageText, { marginBottom: spacing.xs }]}>
          {percentage}%
        </Text>
      )}
      <View
        style={[
          styles.track,
          {
            height: 8,
            borderRadius: radius.pill,
            backgroundColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              height: '100%',
              borderRadius: radius.pill,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
  percentageText: {
    fontVariant: ['tabular-nums'],
  },
});

export default ProgressIndicator;
