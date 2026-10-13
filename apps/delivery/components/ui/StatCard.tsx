import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon, IconName } from '../Icon';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: IconName;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  trendType = 'positive',
  style,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  let trendColor = colors.primary;
  if (trendType === 'negative') trendColor = colors.danger;
  if (trendType === 'neutral') trendColor = colors.textSecondary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.large,
          padding: spacing.md,
          borderColor: colors.border,
          borderWidth: 1,
          ...shadows.xs,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Text variant="caption" weight="bold" style={{ color: colors.textSecondary }}>
          {label.toUpperCase()}
        </Text>

        {icon ? (
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainer }]}>
            <Icon name={icon} size={16} color={colors.primary} />
          </View>
        ) : null}
      </View>

      <Text variant="h3" weight="extrabold" style={{ color: colors.text, marginTop: 4 }}>
        {value}
      </Text>

      {subtitle || trend ? (
        <View style={styles.footerRow}>
          {trend ? (
            <Text variant="caption" weight="bold" style={{ color: trendColor }}>
              {trend}
            </Text>
          ) : null}
          {subtitle ? (
            <Text variant="caption" style={{ color: colors.textMuted, marginLeft: trend ? 4 : 0 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default StatCard;
