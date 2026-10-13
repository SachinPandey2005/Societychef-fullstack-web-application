import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { SettingsRepository } from '../../../repositories/SettingsRepository';
import { useAuthStore } from '../../../store/useAuthStore';
import { useToast } from '../../../components/ui/Toast';
import { ThemeSelector } from '../../../components/theme/ThemeSelector';

export default function SettingsDashboardScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();
  const { logout } = useAuthStore();
  const {
    language,
    theme,
    notificationsEnabled,
    locationPreferences,
    mapPreferences,
    isLoading,
  } = useSettingsStore();

  useEffect(() => {
    SettingsRepository.fetchSettings();
  }, []);

  const handleRefresh = async () => {
    await SettingsRepository.fetchSettings();
  };

  const handleToggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    try {
      await SettingsRepository.updateSettings({ theme: nextTheme });
      showToast(`Theme switched to ${nextTheme}!`, 'success');
    } catch (e) {
      showToast('Failed to switch theme.', 'error');
    }
  };

  const handleToggleNotifications = async () => {
    try {
      await SettingsRepository.updateSettings({ notificationsEnabled: !notificationsEnabled });
      showToast(`Notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}!`, 'success');
    } catch (e) {
      showToast('Failed to update notifications preferences.', 'error');
    }
  };

  const handleRequestExport = async () => {
    try {
      const url = await SettingsRepository.requestExport();
      Alert.alert(
        'Data Export Prepared',
        `Your GDPR compliance data extraction package is ready for download:\n\n${url}`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      showToast('Failed to request data export.', 'error');
    }
  };

  const handleRequestDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to request permanent account deletion? This request will delete all your personal delivery records, settlements history, and kyc documents and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: async () => {
            try {
              await SettingsRepository.requestDelete();
              Alert.alert(
                'Request Submitted',
                'Your deletion request has been registered. Support will review and contact you within 15 business days.',
                [{ text: 'OK' }]
              );
            } catch (e) {
              showToast('Request failed.', 'error');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout of your active session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Application Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Preferences Section */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">General Preferences</Text>
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              
              {/* Theme Selector Section */}
              <View style={{ gap: spacing.xs, marginBottom: spacing.xs }}>
                <View style={styles.settingsLabelGroup}>
                  <Icon name="palette" size={20} colorType="primary" />
                  <Text variant="caption" weight="bold" style={{ marginLeft: 8 }}>Theme Preference (Light • Auto • Dark)</Text>
                </View>
                <ThemeSelector variant="card" />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              {/* Notification Toggles Row */}
              <View style={styles.settingsRow}>
                <View style={styles.settingsLabelGroup}>
                  <Icon name="notifications-active" size={20} colorType="primary" />
                  <Text variant="caption" weight="bold" style={{ marginLeft: 8 }}>Push Notifications</Text>
                </View>
                <Pressable onPress={handleToggleNotifications} style={[styles.optionPill, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}>
                  <Text variant="caption" weight="bold" color={notificationsEnabled ? 'success' : 'secondary'}>
                    {notificationsEnabled ? 'ENABLED' : 'DISABLED'}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              {/* Language Selection Row */}
              <View style={styles.settingsRow}>
                <View style={styles.settingsLabelGroup}>
                  <Icon name="language" size={20} colorType="primary" />
                  <Text variant="caption" weight="bold" style={{ marginLeft: 8 }}>App Language</Text>
                </View>
                <View style={[styles.optionPill, { backgroundColor: colors.surfaceElevated, borderRadius: radius.medium }]}>
                  <Text variant="caption" weight="bold" color="primary">
                    {language === 'en' ? 'ENGLISH' : language.toUpperCase()}
                  </Text>
                </View>
              </View>

            </Card>
          </View>

          {/* Subpages Menu List */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">System & Security Controls</Text>
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              
              {/* Biometrics & Locks dashboard Link */}
              <Pressable onPress={() => router.push('/(main)/settings/security')} style={styles.menuRow}>
                <View style={styles.settingsLabelGroup}>
                  <Icon name="fingerprint" size={20} colorType="secondary" />
                  <Text variant="caption" weight="bold" style={{ marginLeft: 8 }}>Biometrics & Security</Text>
                </View>
                <Icon name="keyboard-arrow-right" size={20} color={colors.textSecondary} />
              </Pressable>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              {/* Devices Management link */}
              <Pressable onPress={() => router.push('/(main)/settings/devices')} style={styles.menuRow}>
                <View style={styles.settingsLabelGroup}>
                  <Icon name="devices" size={20} colorType="secondary" />
                  <Text variant="caption" weight="bold" style={{ marginLeft: 8 }}>Device Management</Text>
                </View>
                <Icon name="keyboard-arrow-right" size={20} color={colors.textSecondary} />
              </Pressable>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              {/* Sync Dashboard link */}
              <Pressable onPress={() => router.push('/(main)/settings/sync_dashboard')} style={styles.menuRow}>
                <View style={styles.settingsLabelGroup}>
                  <Icon name="sync" size={20} colorType="secondary" />
                  <Text variant="caption" weight="bold" style={{ marginLeft: 8 }}>Sync & Resiliency Console</Text>
                </View>
                <Icon name="keyboard-arrow-right" size={20} color={colors.textSecondary} />
              </Pressable>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              {/* Legal documents viewer links */}
              <Pressable onPress={() => router.push('/(main)/settings/compliance')} style={styles.menuRow}>
                <View style={styles.settingsLabelGroup}>
                  <Icon name="gavel" size={20} colorType="secondary" />
                  <Text variant="caption" weight="bold" style={{ marginLeft: 8 }}>Legal & Compliance Policy</Text>
                </View>
                <Icon name="keyboard-arrow-right" size={20} color={colors.textSecondary} />
              </Pressable>

            </Card>
          </View>

          {/* Privacy & GDPR export/delete */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="sm" weight="extrabold">GDPR Privacy & Account Data</Text>
            <Card style={{ padding: spacing.md, gap: spacing.md }}>
              <Text variant="caption" color="secondary" style={{ fontSize: 11 }}>
                In accordance with global data protection laws, you can request an automated extraction archive of all your personal telemetry data or queue permanent deletion of your partner account profile.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  label="Export Data"
                  onPress={handleRequestExport}
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Request Delete"
                  onPress={handleRequestDelete}
                  variant="outline"
                  size="sm"
                  style={{ flex: 1, borderColor: colors.danger }}
                />
              </View>
            </Card>
          </View>

          {/* Logout Button */}
          <Button
            label="Logout Account Session"
            onPress={handleLogout}
            variant="primary"
            size="lg"
            style={{ backgroundColor: colors.danger, marginTop: spacing.md }}
          />

          {/* App Version Info */}
          <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
            <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
              RasoHi Delivery Partner Client v2.4.0
            </Text>
            <Text variant="caption" style={{ fontSize: 9, color: colors.textMuted }}>
              Expo SDK 54 • TypeScript Security Hardened
            </Text>
          </View>

        </View>
      </ScrollableLayout>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
  },
});
