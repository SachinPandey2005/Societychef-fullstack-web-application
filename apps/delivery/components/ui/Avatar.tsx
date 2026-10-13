import React from 'react';
import { View, Image, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../Typography';

export interface AvatarProps {
  sourceUrl?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showStatusIndicator?: boolean;
  isOnline?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  sourceUrl,
  name = 'Delivery Partner',
  size = 'md',
  showStatusIndicator = false,
  isOnline = false,
  style,
}) => {
  const { colors, radius } = useTheme();

  // Resolve size numeric value
  let pixelSize = 48;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 32;
        break;
      case 'md':
        pixelSize = 48;
        break;
      case 'lg':
        pixelSize = 72;
        break;
      case 'xl':
        pixelSize = 96;
        break;
    }
  }

  // Get Initials from Name
  const getInitials = (fullName: string) => {
    if (!fullName || !fullName.trim()) return 'DP';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  // Status indicator size
  const indicatorSize = Math.max(8, Math.round(pixelSize * 0.22));

  return (
    <View style={[styles.container, { width: pixelSize, height: pixelSize }, style]}>
      {sourceUrl ? (
        <Image
          source={{ uri: sourceUrl }}
          style={{ width: pixelSize, height: pixelSize, borderRadius: pixelSize / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: pixelSize,
              height: pixelSize,
              borderRadius: pixelSize / 2,
              backgroundColor: '#E2ECE7',
              borderWidth: 1.5,
              borderColor: '#0B4F3A',
            },
          ]}
        >
          <Text
            variant={pixelSize >= 80 ? 'h3' : pixelSize > 50 ? 'md' : pixelSize > 35 ? 'sm' : 'xs'}
            weight="extrabold"
            style={{ color: '#0B4F3A' }}
          >
            {initials}
          </Text>
        </View>
      )}

      {showStatusIndicator && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: isOnline ? colors.success : colors.textMuted,
              borderColor: colors.surface,
              borderWidth: pixelSize > 50 ? 2 : 1.5,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
  },
});

export default Avatar;
