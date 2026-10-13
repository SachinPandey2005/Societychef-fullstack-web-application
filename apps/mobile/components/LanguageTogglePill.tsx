import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLanguageStore } from '../store/useLanguageStore';
import { useThemeStore } from '../store/useThemeStore';
import { SupportedLanguage } from '../i18n';

interface LanguageTogglePillProps {
  darkBg?: boolean;
}

export function LanguageTogglePill({ darkBg = false }: LanguageTogglePillProps) {
  const Colors = useThemeStore((s) => s.colors);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const isHi = language === 'hi';

  const toggleLanguage = () => {
    const nextLang: SupportedLanguage = isHi ? 'en' : 'hi';
    setLanguage(nextLang);
  };

  return (
    <Pressable
      onPress={toggleLanguage}
      style={[
        styles.pillContainer,
        {
          backgroundColor: darkBg ? 'rgba(255,255,255,0.15)' : (Colors.surfaceAlt || '#F3F4F6'),
          borderColor: darkBg ? 'rgba(255,255,255,0.25)' : Colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Switch app language"
    >
      <View
        style={[
          styles.badge,
          !isHi && { backgroundColor: Colors.primary },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { color: !isHi ? '#FFFFFF' : (darkBg ? '#E5E7EB' : Colors.textMuted) },
          ]}
        >
          EN
        </Text>
      </View>
      <View
        style={[
          styles.badge,
          isHi && { backgroundColor: Colors.primary },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { color: isHi ? '#FFFFFF' : (darkBg ? '#E5E7EB' : Colors.textMuted) },
          ]}
        >
          हिंदी
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
