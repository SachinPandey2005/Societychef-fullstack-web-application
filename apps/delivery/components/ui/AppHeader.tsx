import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBack = false,
  rightAction,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        style,
      ]}
    >
      <View style={styles.leftRow}>
        {showBack && onBack ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={{ flex: 1, marginLeft: showBack ? spacing.sm : 0 }}>
          <Text variant="md" weight="extrabold" style={{ color: colors.text }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" style={{ color: colors.textSecondary, marginTop: 1 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? <View style={styles.rightContainer}>{rightAction}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    minHeight: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default AppHeader;
