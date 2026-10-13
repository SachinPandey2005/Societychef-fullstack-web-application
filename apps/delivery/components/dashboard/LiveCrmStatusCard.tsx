import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { CrmConnectionState } from '../../store/useCrmStatusStore';

interface LiveCrmStatusCardProps {
  connectionState: CrmConnectionState;
  syncing: boolean;
  networkStatus: string;
  lastSyncTime: Date | null;
}

export const LiveCrmStatusCard: React.FC<LiveCrmStatusCardProps> = ({
  connectionState,
  syncing,
  networkStatus,
  lastSyncTime,
}) => {
  const { colors, spacing, radius } = useTheme();

  const getStatusColor = () => {
    switch (connectionState) {
      case 'CONNECTED':
      case 'WAITING_FOR_ORDERS':
      case 'RECEIVING_ORDERS':
        return colors.success;
      case 'SYNCING':
        return colors.secondary;
      case 'DISCONNECTED':
      default:
        return colors.danger;
    }
  };

  const statusColor = getStatusColor();
  const timeFormatted = lastSyncTime
    ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.medium,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          marginTop: spacing.xs,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.leftGroup}>
          <View style={[styles.pulseDot, { backgroundColor: statusColor }]} />
          <Text variant="xs" weight="extrabold" color="primary">
            CRM {syncing ? 'SYNCING...' : connectionState.replace('_', ' ')}
          </Text>
        </View>

        <View style={styles.rightGroup}>
          <Icon name="wifi" size={12} colorType="secondary" />
          <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
            Net: {networkStatus}
          </Text>
          <Text variant="caption" color="muted" style={{ marginLeft: 8 }}>
            Sync: {timeFormatted}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default LiveCrmStatusCard;
