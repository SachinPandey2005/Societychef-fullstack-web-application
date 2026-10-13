import React, { memo, useRef } from 'react';
import { View, Pressable, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'flat' | 'elevated' | 'outlined' | 'gradient';
  shadowSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
  /** Override border radius */
  borderRadius?: number;
  /** Disable the press scale animation */
  noAnimation?: boolean;
  /** Gradient colors — only used when variant='gradient' */
  gradientColors?: readonly [string, string];
  testID?: string;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = memo(({
  children,
  onPress,
  variant = 'elevated',
  shadowSize = 'sm',
  style,
  borderRadius,
  noAnimation = false,
  gradientColors,
  testID,
  accessibilityLabel,
}) => {
  const { colors, radius, shadows, isDark, opacity: themeOpacity } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const resolvedRadius = borderRadius ?? radius.large;

  // Resolve base styles
  const baseStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: resolvedRadius,
    padding: 16,
    overflow: 'hidden',
  };

  // Resolve variants
  let variantStyle: ViewStyle = {};
  switch (variant) {
    case 'flat':
      variantStyle = { backgroundColor: colors.surfaceContainerLow };
      break;
    case 'outlined':
      variantStyle = {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        backgroundColor: colors.surface,
      };
      break;
    case 'elevated':
      variantStyle = shadows[shadowSize];
      break;
    case 'gradient':
      variantStyle = { backgroundColor: 'transparent' };
      break;
  }

  // Press animation handlers
  const handlePressIn = () => {
    if (noAnimation || !onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (noAnimation || !onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  // Gradient wrapper
  const renderContent = (contentChildren: React.ReactNode) => {
    if (variant === 'gradient') {
      const gColors = gradientColors || colors.gradientPrimary;
      return (
        <LinearGradient
          colors={gColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: resolvedRadius, padding: 16 }, style]}
        >
          {contentChildren}
        </LinearGradient>
      );
    }
    return contentChildren;
  };

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          testID={testID}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={({ pressed }) => [
            variant !== 'gradient' && baseStyle,
            variant !== 'gradient' && variantStyle,
            pressed && !noAnimation && { opacity: 1 - themeOpacity.pressed },
            variant !== 'gradient' && style,
          ]}
        >
          {renderContent(children)}
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'gradient') {
    return (
      <View testID={testID}>
        {renderContent(children)}
      </View>
    );
  }

  return (
    <View testID={testID} style={[baseStyle, variantStyle, style]}>
      {children}
    </View>
  );
});

Card.displayName = 'Card';

export default Card;
