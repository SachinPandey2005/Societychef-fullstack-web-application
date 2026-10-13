import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';

export interface BadgeProps {
  count?: number;
  maxCount?: number;
  visible?: boolean;
  dot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  count = 0,
  maxCount = 99,
  visible = true,
  dot = false,
  style,
}) => {
  const { colors, spacing, radius } = useTheme();

  if (!visible || (!dot && count <= 0)) {
    return null;
  }

  // Display count logic
  const displayValue = count > maxCount ? `${maxCount}+` : `${count}`;

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            backgroundColor: colors.danger,
            borderColor: colors.surface,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: colors.danger,
          borderColor: colors.surface,
          borderRadius: radius.pill,
          paddingHorizontal: count > 9 ? spacing.xs : 5,
        },
        style,
      ]}
    >
      <Text variant="caption" weight="bold" color="white" style={styles.badgeText}>
        {displayValue}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    position: 'absolute',
  },
  badgeContainer: {
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'absolute',
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
  },
});

export default Badge;
