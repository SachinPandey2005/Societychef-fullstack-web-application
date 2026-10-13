import { Easing } from 'react-native';

// ─── Color Palette ───────────────────────────────────────────────────────────

export const colors = {
  light: {
    // Primary
    primary: '#0B4F3A',
    primaryContainer: '#E2ECE7',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#05261C',

    // Secondary
    secondary: '#E67E22',
    secondaryContainer: '#FDEBD0',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#6E3B07',

    // Surfaces (MD3 elevation hierarchy)
    background: '#F8F4EA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceContainerLow: '#FAF6F0',
    surfaceContainer: '#EFEBE0',
    surfaceContainerHigh: '#E2ECE7',

    // Text
    text: '#0B4F3A',
    textSecondary: '#5A6E63',
    textMuted: '#8A9C91',

    // Borders & Dividers
    border: '#E5E0D5',
    divider: '#EFEBE0',
    outline: '#5A6E63',
    outlineVariant: '#E2ECE7',

    // Status colors
    success: '#0B4F3A',
    successContainer: '#E2ECE7',
    onSuccess: '#FFFFFF',
    warning: '#F39C12',
    warningContainer: '#FDEBD0',
    onWarning: '#1A1A1A',
    danger: '#E74C3C',
    dangerContainer: '#FADBD8',
    onDanger: '#FFFFFF',
    info: '#3498DB',
    infoContainer: '#EBF5FB',
    onInfo: '#FFFFFF',

    // Accent & Utility
    accent: '#F1C40F',
    scrim: 'rgba(0, 0, 0, 0.32)',
    shadowColor: '#05261C',

    // Gradient pairs
    gradientPrimary: ['#0B4F3A', '#136D52'] as readonly string[],
    gradientSecondary: ['#E67E22', '#F39C12'] as readonly string[],
    gradientSurface: ['#F8F4EA', '#FFFFFF'] as readonly string[],
  },
  dark: {
    // Primary
    primary: '#16A375',
    primaryContainer: '#102820',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#D4F5E2',

    // Secondary
    secondary: '#E67E22',
    secondaryContainer: '#3B230B',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#FFECD4',

    // Surfaces (SocietyChef Dark Green Palette)
    background: '#071A14',
    surface: '#102820',
    surfaceElevated: '#15352A',
    surfaceContainerLow: '#0B201A',
    surfaceContainer: '#102820',
    surfaceContainerHigh: '#193C30',

    // Text
    text: '#F4F7F3',
    textSecondary: '#AABBB3',
    textMuted: '#6B8277',

    // Borders & Dividers
    border: '#1A3B30',
    divider: '#143026',
    outline: '#AABBB3',
    outlineVariant: '#15352A',

    // Status colors
    success: '#16A375',
    successContainer: '#102820',
    onSuccess: '#FFFFFF',
    warning: '#F39C12',
    warningContainer: '#422800',
    onWarning: '#FFFFFF',
    danger: '#E74C3C',
    dangerContainer: '#42120F',
    onDanger: '#FFFFFF',
    info: '#3498DB',
    infoContainer: '#0B293C',
    onInfo: '#FFFFFF',

    // Accent & Utility
    accent: '#F1C40F',
    scrim: 'rgba(0, 0, 0, 0.65)',
    shadowColor: '#000000',

    // Gradient pairs
    gradientPrimary: ['#0B4F3A', '#16A375'] as readonly string[],
    gradientSecondary: ['#E67E22', '#F39C12'] as readonly string[],
    gradientSurface: ['#071A14', '#102820'] as readonly string[],
  },
};

// ─── Spacing Scale ───────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radius = {
  small: 6,
  medium: 10,
  large: 14,
  xlarge: 18,
  xxlarge: 24,
  pill: 9999,
} as const;

// ─── Shadows (Elevation System) ─────────────────────────────────────────────

export const shadows = {
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
};

// ─── Typography Scale ────────────────────────────────────────────────────────

export const typography = {
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    extrabold: 'Inter-ExtraBold',
  },
  sizes: {
    caption: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    h3: 28,
    h2: 32,
    h1: 40,
  },
  lineHeights: {
    caption: 14,
    xs: 16,
    sm: 20,
    md: 24,
    lg: 26,
    xl: 28,
    xxl: 32,
    h3: 36,
    h2: 40,
    h1: 48,
  },
  letterSpacing: {
    caption: 0.4,
    xs: 0.25,
    sm: 0.15,
    md: 0.15,
    lg: 0.1,
    xl: 0,
    xxl: 0,
    h3: -0.25,
    h2: -0.5,
    h1: -0.75,
  },
} as const;

// ─── Animation Durations ─────────────────────────────────────────────────────

export const durations = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  shimmer: 1200,
} as const;

// ─── Motion / Easing Configs ─────────────────────────────────────────────────

export const motion = {
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springGentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },
} as const;

// ─── Opacity Tokens ──────────────────────────────────────────────────────────

export const opacity = {
  disabled: 0.38,
  pressed: 0.12,
  hover: 0.08,
  focus: 0.12,
  dragged: 0.16,
  overlay: 0.56,
} as const;

// ─── Combined Export ─────────────────────────────────────────────────────────

export const designTokens = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  durations,
  motion,
  opacity,
};
