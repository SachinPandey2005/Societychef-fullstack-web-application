import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { Palettes } from '../constants/colors';

export type ThemeMode = 'light' | 'dark' | 'default';

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  colors: typeof Palettes.light;
  setMode: (mode: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'rasohi.themeMode.v2';

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'default') {
    return 'light';
  }
  return mode;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'default',
  resolvedTheme: resolve('default'),
  colors: Palettes[resolve('default')],
  setMode: async (mode: ThemeMode) => {
    const resolvedTheme = resolve(mode);
    set({ mode, resolvedTheme, colors: Palettes[resolvedTheme] });
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  },
  hydrate: async () => {
    try {
      let saved = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeMode | 'system' | null;
      if (saved === 'system') saved = 'default';
      const mode = saved ?? 'default';
      const resolvedTheme = resolve(mode);
      set({ mode, resolvedTheme, colors: Palettes[resolvedTheme] });
    } catch (e) {
      console.warn('Failed to hydrate theme store:', e);
    }
  },
}));

// Keep in sync with OS changes when mode === 'default'
Appearance.addChangeListener(() => {
  const { mode, setMode } = useThemeStore.getState();
  if (mode === 'default') {
    setMode('default'); // forces recalculation of resolvedTheme and colors
  }
});
