import { create } from 'zustand';
import { useThemeStore } from './useThemeStore';

interface SettingsState {
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  orderAlertSound: string;
  autoAcceptOrders: boolean;
  language: 'en' | 'hi' | 'kn' | 'ta';
  locationPreferences: 'ALWAYS' | 'WHILE_USING' | 'DISABLED';
  mapPreferences: 'GOOGLE' | 'APPLE' | 'OSM';
  theme: 'light' | 'dark' | 'system';
  sosContactName: string;
  sosContactPhone: string;
  isLoading: boolean;
  error: string | null;

  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  setOrderAlertSound: (soundName: string) => void;
  setAutoAcceptOrders: (autoAccept: boolean) => void;
  setLanguage: (lang: 'en' | 'hi' | 'kn' | 'ta') => void;
  setLocationPreferences: (pref: 'ALWAYS' | 'WHILE_USING' | 'DISABLED') => void;
  setMapPreferences: (pref: 'GOOGLE' | 'APPLE' | 'OSM') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSosContact: (name: string, phone: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  notificationsEnabled: true,
  biometricsEnabled: false,
  orderAlertSound: 'loud_siren',
  autoAcceptOrders: false,
  language: 'en',
  locationPreferences: 'ALWAYS',
  mapPreferences: 'GOOGLE',
  theme: 'system',
  sosContactName: 'Operations Control Room',
  sosContactPhone: '+91 8095958822',
  isLoading: false,
  error: null,

  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setBiometricsEnabled: (biometricsEnabled) => set({ biometricsEnabled }),
  setOrderAlertSound: (orderAlertSound) => set({ orderAlertSound }),
  setAutoAcceptOrders: (autoAcceptOrders) => set({ autoAcceptOrders }),
  setLanguage: (language) => set({ language }),
  setLocationPreferences: (locationPreferences) => set({ locationPreferences }),
  setMapPreferences: (mapPreferences) => set({ mapPreferences }),
  setTheme: (theme) => {
    set({ theme });
    useThemeStore.getState().setTheme(theme);
  },
  setSosContact: (name, phone) => set({ sosContactName: name, sosContactPhone: phone }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default useSettingsStore;
