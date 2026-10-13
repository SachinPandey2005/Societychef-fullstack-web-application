import React from 'react';
import { View, StyleSheet, Pressable, Appearance } from 'react-native';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import { Text } from '../Typography';
import { Icon, IconName } from '../Icon';
import { useToast } from '../ui/Toast';
import { SettingsRepository } from '../../repositories/SettingsRepository';

interface ThemeSelectorProps {
  variant?: 'card' | 'segmented';
}

interface ThemeOption {
  id: ThemeMode;
  label: string;
  subtitle: string;
  icon: IconName;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    label: 'Light',
    subtitle: 'Always bright theme',
    icon: 'wb-sunny',
  },
  {
    id: 'system',
    label: 'Auto',
    subtitle: 'Follows system UI',
    icon: 'settings-suggest',
  },
  {
    id: 'dark',
    label: 'Dark',
    subtitle: 'Always dark theme',
    icon: 'nights-stay',
  },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ variant = 'card' }) => {
  const { colors, radius, spacing, themeMode, setThemeMode, isDark } = useTheme();
  const { showToast } = useToast();

  const handleSelectTheme = async (mode: ThemeMode) => {
    if (mode === themeMode) return;
    try {
      setThemeMode(mode);
      await SettingsRepository.updateSettings({ theme: mode });
      const modeText = mode === 'system' ? 'Auto (System)' : mode.toUpperCase();
      showToast(`Theme mode set to ${modeText}!`, 'success');
    } catch (e) {
      showToast(`Switched theme to ${mode === 'system' ? 'Auto' : mode}`, 'info');
    }
  };

  const systemColorScheme = Appearance.getColorScheme() || 'light';

  if (variant === 'segmented') {
    return (
      <View style={[styles.segmentedContainer, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.medium, padding: 4 }]}>
        {THEME_OPTIONS.map((opt) => {
          const isActive = themeMode === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => handleSelectTheme(opt.id)}
              style={[
                styles.segmentedItem,
                { borderRadius: radius.small },
                isActive && {
                  backgroundColor: colors.surfaceElevated,
                  shadowColor: colors.shadowColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
            >
              <Icon
                name={opt.icon}
                size={18}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text
                variant="caption"
                weight={isActive ? 'extrabold' : 'semibold'}
                style={{
                  color: isActive ? colors.primary : colors.textSecondary,
                  marginLeft: 6,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.gridContainer}>
        {THEME_OPTIONS.map((opt) => {
          const isActive = themeMode === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => handleSelectTheme(opt.id)}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isActive ? colors.primaryContainer : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderRadius: radius.large,
                  padding: spacing.md,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceContainerLow,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Icon
                    name={opt.icon}
                    size={20}
                    color={isActive ? colors.onPrimary : colors.textSecondary}
                  />
                </View>

                {isActive && (
                  <View
                    style={[
                      styles.checkBadge,
                      { backgroundColor: colors.primary, borderRadius: radius.pill },
                    ]}
                  >
                    <Icon name="check" size={14} color={colors.onPrimary} />
                  </View>
                )}
              </View>

              <Text
                variant="sm"
                weight="extrabold"
                style={{
                  color: isActive ? colors.primary : colors.text,
                  marginTop: spacing.xs,
                }}
              >
                {opt.label}
              </Text>
              
              <Text
                variant="caption"
                style={{
                  color: isActive ? colors.textSecondary : colors.textMuted,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                {opt.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Auto / System Mode Active Status Banner */}
      {themeMode === 'system' && (
        <View style={[styles.statusBanner, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.medium, padding: spacing.sm }]}>
          <Icon name="info" size={16} colorType="primary" />
          <Text variant="caption" color="secondary" style={{ marginLeft: 8, flex: 1, fontSize: 11 }}>
            Auto Mode active — Automatically matched to system preference ({systemColorScheme.toUpperCase()} mode).
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionCard: {
    flex: 1,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadge: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentedItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});

export default ThemeSelector;
