import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Button } from './Button';
import { EmptyIllustration } from '../../illustrations';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There is currently nothing to display here.',
  actionLabel,
  onActionPress,
  style,
}) => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <EmptyIllustration size={160} />
      <Text variant="md" weight="bold" color="default" align="center" style={[styles.title, { marginTop: spacing.md }]}>
        {title}
      </Text>
      <Text variant="sm" color="secondary" align="center" style={[styles.description, { marginTop: spacing.xs }]}>
        {description}
      </Text>
      {actionLabel && onActionPress && (
        <Button
          label={actionLabel}
          onPress={onActionPress}
          variant="outline"
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

export default EmptyState;
