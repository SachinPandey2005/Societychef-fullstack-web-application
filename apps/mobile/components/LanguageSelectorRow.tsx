import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { SupportedLanguage } from '../i18n';

const OPTIONS: { key: SupportedLanguage; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिंदी' },
];

export function LanguageSelectorRow() {
  const { t } = useTranslation();
  const Colors = useThemeStore((s) => s.colors);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <View style={styles.themeRow}>
      <Text style={[styles.prefLabel, { color: Colors.dark || Colors.textPrimary }]}>
        {t('profile.appLanguage', 'App Language')}
      </Text>
      <View style={styles.themeOptions}>
        {OPTIONS.map((opt) => {
          const isActive = language === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[
                styles.themePill,
                {
                  backgroundColor: isActive ? Colors.primary : Colors.surface,
                  borderColor: isActive ? Colors.primary : Colors.border,
                },
              ]}
              onPress={() => setLanguage(opt.key)}
            >
              <Text
                style={[
                  styles.themePillText,
                  {
                    color: isActive ? '#ffffff' : (Colors.dark || Colors.textPrimary),
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  themePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  themePillText: {
    fontSize: 12,
  },
});
