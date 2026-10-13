import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';
import { SystemStatusState } from '../../services/systemCheck.service';

interface NetworkStatusBannerProps {
  systemStatus: SystemStatusState;
  onFixGps?: () => void;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({ systemStatus, onFixGps }) => {
  const { colors, spacing, radius } = useTheme();

  const issues: string[] = [];

  if (!systemStatus.gpsEnabled) {
    issues.push('GPS is disabled');
  }
  if (!systemStatus.internetConnected) {
    issues.push('Internet offline');
  }
  if (systemStatus.locationPermission !== 'granted') {
    issues.push('Location permission needed');
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.dangerContainer,
          borderRadius: radius.medium,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 2,
          marginBottom: spacing.xs,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon name="error-outline" size={16} colorType="danger" containerStyle={{ flexShrink: 0 }} />
        <Text variant="caption" weight="bold" color="danger" style={{ marginLeft: 6, flex: 1, flexShrink: 1, fontSize: 11 }}>
          System Warning: {issues.join(' • ')}
        </Text>

        {onFixGps && (
          <TouchableOpacity activeOpacity={0.7} onPress={onFixGps} style={styles.fixBtn}>
            <Text variant="caption" weight="extrabold" color="danger" style={{ fontSize: 11 }}>
              Fix Now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fixBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 6,
    marginLeft: 6,
    flexShrink: 0,
  },
});

export default NetworkStatusBanner;
