import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon, IconName } from '../Icon';

export type InfoCardType = 'success' | 'warning' | 'danger' | 'info';

export interface InfoCardProps {
  title: string;
  description: string;
  type?: InfoCardType;
  icon?: IconName;
  style?: ViewStyle;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  type = 'info',
  icon,
  style,
}) => {
  const { colors, spacing, radius } = useTheme();

  // Resolve styles based on card type
  let bgStyle: ViewStyle = {};
  let iconName: IconName = 'info';
  let textColorType: 'success' | 'warning' | 'danger' | 'info' = 'info';

  switch (type) {
    case 'success':
      bgStyle = { backgroundColor: colors.successContainer };
      iconName = 'check-circle';
      textColorType = 'success';
      break;
    case 'warning':
      bgStyle = { backgroundColor: colors.warningContainer };
      iconName = 'warning';
      textColorType = 'warning';
      break;
    case 'danger':
      bgStyle = { backgroundColor: colors.dangerContainer };
      iconName = 'error';
      textColorType = 'danger';
      break;
    case 'info':
      bgStyle = { backgroundColor: colors.infoContainer };
      iconName = 'info';
      textColorType = 'info';
      break;
  }

  // Override icon if provided
  const finalIcon = icon || iconName;

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius.medium,
          padding: spacing.md,
        },
        bgStyle,
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Icon name={finalIcon} size={20} colorType={textColorType} />
        <Text variant="sm" weight="semibold" color={textColorType} style={{ marginLeft: spacing.xs }}>
          {title}
        </Text>
      </View>
      <Text variant="xs" color="secondary" style={[styles.description, { marginTop: spacing.xs }]}>
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    lineHeight: 18,
  },
});

export default InfoCard;
