import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LoadingIndicator } from './LoadingIndicator';
import { useTheme } from '../../theme/ThemeContext';

export interface LoadingStateProps {
  label?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading...',
  fullScreen = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        fullScreen ? styles.fullScreen : styles.container,
        { backgroundColor: fullScreen ? colors.background : 'transparent' },
        style,
      ]}
    >
      <LoadingIndicator size="large" label={label} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default LoadingState;
