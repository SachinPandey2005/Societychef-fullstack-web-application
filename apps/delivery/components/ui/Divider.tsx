import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface DividerProps {
  style?: ViewStyle;
  vertical?: boolean;
  spacingSize?: 'xs' | 'sm' | 'md' | 'lg' | 'none';
}

export const Divider: React.FC<DividerProps> = ({
  style,
  vertical = false,
  spacingSize = 'md',
}) => {
  const { colors, spacing } = useTheme();

  // Resolve margins
  let margin = 0;
  if (spacingSize !== 'none') {
    margin = spacing[spacingSize];
  }

  const dividerStyle: ViewStyle = vertical
    ? {
        width: 1.5,
        height: '100%',
        backgroundColor: colors.border,
        marginHorizontal: margin,
      }
    : {
        width: '100%',
        height: 1.5,
        backgroundColor: colors.border,
        marginVertical: margin,
      };

  return <View style={[dividerStyle, style]} />;
};

export default Divider;
