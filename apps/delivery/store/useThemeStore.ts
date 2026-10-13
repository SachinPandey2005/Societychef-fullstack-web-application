import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeType;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeType) => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      setTheme: (theme: ThemeType) => {
        let resolved: 'light' | 'dark' = 'light';
        if (theme === 'system') {
          resolved = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
        } else {
          resolved = theme;
        }
        set({ theme, resolvedTheme: resolved });
      },
      hydrate: () => {
        // Run alignment check with current system preference if 'system' theme is active
        const { theme } = get();
        if (theme === 'system') {
          const systemTheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
          set({ resolvedTheme: systemTheme });
        }
      },
    }),
    {
      name: 'societychef-delivery-theme-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }), // persist only choice
    }
  )
);

// Listen to system changes
Appearance.addChangeListener(({ colorScheme }) => {
  const currentTheme = useThemeStore.getState().theme;
  if (currentTheme === 'system') {
    useThemeStore.setState({ resolvedTheme: colorScheme === 'dark' ? 'dark' : 'light' });
  }
});
