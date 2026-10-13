import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LANGUAGE_KEY, SupportedLanguage, getDeviceLanguage } from '../i18n';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: i18n.language as SupportedLanguage || getDeviceLanguage(),
  setLanguage: async (lang: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(lang);
      set({ language: lang });
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to set language:', e);
    }
  },
  hydrate: async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      const nextLang: SupportedLanguage =
        savedLang === 'en' || savedLang === 'hi' ? savedLang : getDeviceLanguage();
      if (i18n.language !== nextLang) {
        await i18n.changeLanguage(nextLang);
      }
      set({ language: nextLang });
    } catch (e) {
      console.warn('Failed to hydrate language store:', e);
    }
  },
}));
