import { createContext, useContext } from 'react';
import { colors, spacing, radius, shadows, typography, durations, motion, opacity } from './tokens';

export type ThemeColors = typeof colors.light;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Shadows = typeof shadows;
export type Typography = typeof typography;
export type Durations = typeof durations;
export type Motion = typeof motion;
export type Opacity = typeof opacity;

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: ThemeColors;
  spacing: Spacing;
  radius: Radius;
  shadows: Shadows;
  typography: Typography;
  durations: Durations;
  motion: Motion;
  opacity: Opacity;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<Theme | null>(null);

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
