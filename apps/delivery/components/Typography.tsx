import React, { memo } from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type FontVariant = 'caption' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'h3' | 'h2' | 'h1';
export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type TextColor = 'default' | 'secondary' | 'muted' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'white';

export interface TextProps extends RNTextProps {
  variant?: FontVariant;
  weight?: FontWeight;
  color?: TextColor;
  align?: 'auto' | 'left' | 'center' | 'right' | 'justify';
  numberOfLines?: number;
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export const Text: React.FC<TextProps> = memo(({
  variant = 'md',
  weight = 'regular',
  color = 'default',
  align = 'auto',
  style,
  children,
  ...props
}) => {
  const { colors, typography: themeTypography } = useTheme();

  // Resolve Font Color
  let textStyleColor = colors.text;
  switch (color) {
    case 'secondary':
      textStyleColor = colors.textSecondary;
      break;
    case 'muted':
      textStyleColor = colors.textMuted;
      break;
    case 'primary':
      textStyleColor = colors.primary;
      break;
    case 'success':
      textStyleColor = colors.success;
      break;
    case 'warning':
      textStyleColor = colors.warning;
      break;
    case 'danger':
      textStyleColor = colors.danger;
      break;
    case 'info':
      textStyleColor = colors.info;
      break;
    case 'white':
      textStyleColor = '#FFFFFF';
      break;
  }

  // Resolve Font Size, Line Height & Letter Spacing
  const fontSize = themeTypography.sizes[variant];
  const lineHeight = themeTypography.lineHeights[variant];
  const letterSpacing = themeTypography.letterSpacing[variant];

  // Resolve Font Family/Weight style
  let fontFamilyStyle: TextStyle = styles.regular;
  switch (weight) {
    case 'medium':
      fontFamilyStyle = styles.medium;
      break;
    case 'semibold':
      fontFamilyStyle = styles.semibold;
      break;
    case 'bold':
      fontFamilyStyle = styles.bold;
      break;
    case 'extrabold':
      fontFamilyStyle = styles.extrabold;
      break;
  }

  const customStyle: TextStyle = {
    color: textStyleColor,
    fontSize,
    lineHeight,
    letterSpacing,
    textAlign: align,
  };

  return (
    <RNText
      allowFontScaling={true}
      style={[fontFamilyStyle, customStyle, style]}
      {...props}
    >
      {children}
    </RNText>
  );
});

Text.displayName = 'Text';

const styles = StyleSheet.create({
  regular: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
  },
  medium: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  semibold: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  bold: {
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  extrabold: {
    fontFamily: 'Inter-ExtraBold',
    fontWeight: '800',
  },
});

export default Text;
