import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { capitalize } from '../../utils';

export type ChipStatus = 'assigned' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'online' | 'offline';

export interface StatusChipProps {
  status: ChipStatus;
  style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  style,
}) => {
  const { colors, spacing, radius } = useTheme();

  // Resolve styles
  let bgStyle: ViewStyle = {};
  let textColorType: 'success' | 'warning' | 'danger' | 'info' | 'secondary' = 'info';

  switch (status) {
    case 'online':
    case 'delivered':
      bgStyle = { backgroundColor: colors.successContainer };
      textColorType = 'success';
      break;
    case 'offline':
    case 'cancelled':
      bgStyle = { backgroundColor: colors.dangerContainer };
      textColorType = 'danger';
      break;
    case 'assigned':
    case 'preparing':
      bgStyle = { backgroundColor: colors.warningContainer };
      textColorType = 'warning';
      break;
    case 'ready':
    case 'picked_up':
      bgStyle = { backgroundColor: colors.infoContainer };
      textColorType = 'info';
      break;
  }

  // Format label text (e.g. ready_for_pickup -> Ready For Pickup)
  const label = status.split('_').map(capitalize).join(' ');

  return (
    <View
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          paddingVertical: spacing.xs / 2,
          paddingHorizontal: spacing.sm,
        },
        bgStyle,
        style,
      ]}
    >
      <Text variant="xs" weight="semibold" color={textColorType}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StatusChip;
