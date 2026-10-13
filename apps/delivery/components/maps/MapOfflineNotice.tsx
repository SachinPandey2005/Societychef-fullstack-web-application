import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon } from '../Icon';

interface MapOfflineNoticeProps {
  isOffline: boolean;
}

export const MapOfflineNotice: React.FC<MapOfflineNoticeProps> = ({ isOffline }) => {
  const { colors, spacing, radius } = useTheme();

  if (!isOffline) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.warningContainer,
          borderColor: colors.warning,
          borderRadius: radius.medium,
          padding: spacing.xs,
        },
      ]}
    >
      <Icon name="signal-cellular-connected-no-internet-4-bar" size={16} colorType="warning" />
      <Text variant="caption" weight="bold" color="warning" style={{ marginLeft: 6, flex: 1 }}>
        Offline Mode: Running on cached map tiles & route polyline.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginVertical: 6,
  },
});

export default MapOfflineNotice;
