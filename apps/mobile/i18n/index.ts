import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import hi from './locales/hi.json';

export const LANGUAGE_KEY = 'rasohi.language.v1';
export const SUPPORTED_LANGUAGES = ['en', 'hi'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    const primaryLocale = locales && locales.length > 0 ? locales[0] : null;
    const langCode = primaryLocale?.languageCode?.toLowerCase();
    if (langCode === 'hi') {
      return 'hi';
    }
  } catch (e) {
    console.warn('Failed to detect device language:', e);
  }
  return 'en';
}

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react handles XSS escaping safely
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
