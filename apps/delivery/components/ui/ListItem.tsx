import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon, IconName } from '../Icon';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  rightText?: string;
  onPress?: () => void;
  badge?: string | number;
  divider?: boolean;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon = 'chevron-right',
  rightText,
  onPress,
  badge,
  divider = true,
  style,
}) => {
  const { colors, spacing } = useTheme();

  const content = (
    <View
      style={[
        styles.container,
        {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: divider ? 1 : 0,
          borderBottomColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.leftRow}>
        {leftIcon ? (
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
            <Icon name={leftIcon} size={18} color={colors.primary} />
          </View>
        ) : null}

        <View style={{ flex: 1, marginLeft: leftIcon ? spacing.sm : 0 }}>
          <Text variant="sm" weight="bold" style={{ color: colors.text }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" style={{ color: colors.textSecondary, marginTop: 1 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightRow}>
        {rightText ? (
          <Text variant="xs" weight="bold" style={{ color: colors.primary }}>
            {rightText}
          </Text>
        ) : null}

        {badge !== undefined ? (
          <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
            <Text variant="caption" weight="bold" style={{ color: colors.primary, fontSize: 10 }}>
              {badge}
            </Text>
          </View>
        ) : null}

        {onPress && rightIcon ? (
          <Icon name={rightIcon} size={18} color={colors.textSecondary} />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} accessibilityRole="button">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});

export default ListItem;
