const light = {
  bg: '#F7F3EB',
  surface: '#FFFDF9',
  surfaceAlt: '#E8E4D9',
  border: '#D8E3D7',
  primary: '#123524',
  primaryDeep: '#0A2116',
  dark: '#123524',
  muted: '#6B6B6B',
  secondary: '#2F6B4F',
  red: '#C84B31',
  green: '#2F6B4F',
  gold: '#D4AF37',
  goldDark: '#C89B3C',
  goldLight: '#F8E8C8',
  goldBorder: '#D4AF37',
  orange: '#E87D3E',
  blue: '#3A7CA5',
  pillInactive: '#E8E4D9',
  greenBadge: '#D8E3D7',
  goldBadge: '#F8E8C8',
  blueBadge: '#EAF2F7',
  textPrimary: '#123524',
  textMuted: '#6B6B6B',
  textInverse: '#FFFFFF',
};

// Derived dark mode equivalent to maintain dual-theme support
const dark = {
  bg: '#0A2116',
  surface: '#123524',
  surfaceAlt: '#2F6B4F',
  border: '#4F8A68',
  primary: '#D4AF37',
  primaryDeep: '#C89B3C',
  dark: '#FFFFFF',
  muted: '#E8E4D9',
  secondary: '#2F6B4F',
  red: '#E05343',
  green: '#5F9D7A',
  gold: '#D4AF37',
  goldDark: '#C89B3C',
  goldLight: '#241E10',
  goldBorder: '#D4AF37',
  orange: '#F59653',
  blue: '#5B96EF',
  pillInactive: '#2F6B4F',
  greenBadge: '#123524',
  goldBadge: '#382B14',
  blueBadge: '#19283B',
  textPrimary: '#FFFFFF',
  textMuted: '#E8E4D9',
  textInverse: '#0A2116',
};

export const Palettes = { light, dark };

// Fallback for components not yet refactored to useThemeStore
export const Colors = Palettes.light;

