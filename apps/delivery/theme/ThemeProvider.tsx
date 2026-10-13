import React, { ReactNode, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { ThemeContext, Theme } from './ThemeContext';
import { useThemeStore } from '../store/useThemeStore';
import { colors, spacing, radius, shadows, typography, durations, motion, opacity } from './tokens';
import { fontAssets } from './fonts';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  // Load Inter font family
  const [fontsLoaded] = useFonts(fontAssets);

  // On web, fonts may fail to load silently. Use a timeout fallback
  // so the app doesn't stay stuck on a blank screen forever.
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web' && !fontsLoaded) {
      const timer = setTimeout(() => setFontTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  const fontsReady = fontsLoaded || fontTimeout;

  const themeMode = useThemeStore((s) => s.theme);
  const setThemeStore = useThemeStore((s) => s.setTheme);

  const theme: Theme = {
    colors: isDark ? colors.dark : colors.light,
    spacing,
    radius,
    shadows,
    typography,
    durations,
    motion,
    opacity,
    isDark,
    themeMode,
    setThemeMode: (mode) => {
      setThemeStore(mode);
    },
  };

  // Show a minimal loading screen while fonts load
  if (!fontsReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
        <ActivityIndicator size="large" color={isDark ? colors.dark.primary : colors.light.primary} />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ThemeProvider;
