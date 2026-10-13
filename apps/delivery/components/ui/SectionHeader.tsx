import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string | number;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
  badge,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        <Text variant="sm" weight="extrabold" style={{ color: colors.primary }}>
          {title}
        </Text>

        {badge !== undefined ? (
          <View style={[styles.badgeContainer, { backgroundColor: colors.primaryContainer }]}>
            <Text variant="caption" weight="bold" style={{ color: colors.primary, fontSize: 10 }}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAction}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text variant="caption" weight="bold" style={{ color: colors.primary }}>
            {actionLabel}
          </Text>
          <Icon name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});

export default SectionHeader;
