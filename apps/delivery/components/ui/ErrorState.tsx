import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from './Button';
import { OfflineIllustration } from '../../illustrations';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  description = 'An error occurred while loading this screen. Please try again.',
  actionLabel = 'Try Again',
  onRetry,
  style,
}) => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <OfflineIllustration size={160} />
      <Text variant="md" weight="bold" color="danger" align="center" style={[styles.title, { marginTop: spacing.md }]}>
        {title}
      </Text>
      <Text variant="sm" color="secondary" align="center" style={[styles.description, { marginTop: spacing.xs }]}>
        {description}
      </Text>
      {onRetry && (
        <Button
          label={actionLabel}
          onPress={onRetry}
          variant="primary"
          leftIcon="refresh"
          style={{ marginTop: spacing.lg }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    maxWidth: 260,
  },
  description: {
    maxWidth: 240,
    lineHeight: 20,
  },
});

export default ErrorState;
