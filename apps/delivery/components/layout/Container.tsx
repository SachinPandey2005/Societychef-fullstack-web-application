import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface ContainerProps {
  children: React.ReactNode;
  paddingSize?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  marginSize?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  flex?: number;
  row?: boolean;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  style?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  paddingSize = 'none',
  marginSize = 'none',
  flex,
  row = false,
  align,
  justify,
  style,
}) => {
  const { spacing } = useTheme();

  const customStyle: ViewStyle = {
    flex,
    flexDirection: row ? 'row' : 'column',
    alignItems: align,
    justifyContent: justify,
  };

  if (paddingSize !== 'none') {
    customStyle.padding = spacing[paddingSize];
  }
  if (marginSize !== 'none') {
    customStyle.margin = spacing[marginSize];
  }

  return <View style={[customStyle, style]}>{children}</View>;
};

export default Container;
