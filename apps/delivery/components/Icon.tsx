import React, { memo } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export type IconName = keyof typeof MaterialIcons.glyphMap;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  colorType?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'success' | 'warning' | 'danger' | 'info' | 'white';
  /** Optional container style — useful for icon backgrounds (MD3 icon containers) */
  containerStyle?: StyleProp<ViewStyle>;
  /** Show icon inside a circular tinted background */
  contained?: boolean;
  /** Container size multiplier (relative to icon size) */
  containerScale?: number;
}

export const Icon: React.FC<IconProps> = memo(({
  name,
  size = 24,
  color,
  colorType,
  containerStyle,
  contained = false,
  containerScale = 1.8,
}) => {
  const { colors, radius: themeRadius } = useTheme();

  // Determine color
  let resolvedColor = colors.text;
  if (color) {
    resolvedColor = color;
  } else if (colorType) {
    switch (colorType) {
      case 'primary':
        resolvedColor = colors.primary;
        break;
      case 'secondary':
        resolvedColor = colors.secondary;
        break;
      case 'text':
        resolvedColor = colors.text;
        break;
      case 'textSecondary':
        resolvedColor = colors.textSecondary;
        break;
      case 'success':
        resolvedColor = colors.success;
        break;
      case 'warning':
        resolvedColor = colors.warning;
        break;
      case 'danger':
        resolvedColor = colors.danger;
        break;
      case 'info':
        resolvedColor = colors.info;
        break;
      case 'white':
        resolvedColor = '#FFFFFF';
        break;
    }
  }

  // Resolve container background for contained variant
  const getContainerBg = (): string => {
    if (colorType === 'primary') return colors.primaryContainer;
    if (colorType === 'secondary') return colors.secondaryContainer;
    if (colorType === 'success') return colors.successContainer;
    if (colorType === 'warning') return colors.warningContainer;
    if (colorType === 'danger') return colors.dangerContainer;
    if (colorType === 'info') return colors.infoContainer;
    return colors.surfaceContainerHigh;
  };

  const iconElement = (
    <MaterialIcons
      name={name}
      size={size}
      color={resolvedColor}
    />
  );

  if (contained || containerStyle) {
    const containerSize = size * containerScale;
    return (
      <View
        style={[
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: contained ? getContainerBg() : 'transparent',
          },
          containerStyle,
        ]}
      >
        {iconElement}
      </View>
    );
  }

  return iconElement;
});

Icon.displayName = 'Icon';

export default Icon;
