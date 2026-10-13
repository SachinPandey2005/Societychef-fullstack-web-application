import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Text } from '../../components/Typography';
import { Card } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';
import { IconButton } from '../../components/ui/IconButton';
import { Divider } from '../../components/ui/Divider';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();

  const {
    notificationsEnabled,
    autoAcceptOrders,
    locationPreferences,
    setNotificationsEnabled,
    setAutoAcceptOrders,
    setLocationPreferences,
  } = useSettingsStore();

  const handleToggleNotifications = (val: boolean) => {
    setNotificationsEnabled(val);
    showToast(`Order push notifications ${val ? 'enabled' : 'disabled'}`, 'info');
  };

  const handleToggleAutoAccept = (val: boolean) => {
    setAutoAcceptOrders(val);
    showToast(`Auto-accept deliveries ${val ? 'enabled' : 'disabled'}`, 'info');
  };

  const handleToggleLocation = (val: boolean) => {
    setLocationPreferences(val ? 'ALWAYS' : 'DISABLED');
    showToast(`Always-on GPS tracking ${val ? 'enabled' : 'disabled'}`, 'info');
  };

  return (
    <ScreenWrapper>
      <View style={[styles.titleBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Back button" />
        <Text variant="sm" weight="bold" style={styles.titleText}>
          App Settings
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { padding: spacing.md }]}>
        <Card variant="elevated" style={styles.card}>
          <Text variant="sm" weight="bold" style={{ marginBottom: spacing.md }}>
            Notification Preferences
          </Text>

          {/* Push Toggles */}
          <View style={styles.settingRow}>
            <View style={styles.meta}>
              <Text variant="xs" weight="semibold">
                Delivery Alerts
              </Text>
              <Text variant="caption" color="secondary">
                Receive notifications of new delivery requests.
              </Text>
            </View>
            <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
          </View>

          <Divider spacingSize="md" />

          {/* Auto accept Toggles */}
          <View style={styles.settingRow}>
            <View style={styles.meta}>
              <Text variant="xs" weight="semibold">
                Auto-Accept Deliveries
              </Text>
              <Text variant="caption" color="secondary">
                Automatically accept incoming deliveries when online.
              </Text>
            </View>
            <Switch value={autoAcceptOrders} onValueChange={handleToggleAutoAccept} />
          </View>
        </Card>

        <Card variant="elevated" style={[styles.card, { marginTop: spacing.md }]}>
          <Text variant="sm" weight="bold" style={{ marginBottom: spacing.md }}>
            Location & GPS Services
          </Text>

          {/* GPS Tracking toggles */}
          <View style={styles.settingRow}>
            <View style={styles.meta}>
              <Text variant="xs" weight="semibold">
                Always-on Tracking
              </Text>
              <Text variant="caption" color="secondary">
                Track location in background for route compliance.
              </Text>
            </View>
            <Switch value={locationPreferences === 'ALWAYS'} onValueChange={handleToggleLocation} />
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
  },
  titleText: {
    flex: 1,
    marginLeft: 8,
    textAlign: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  card: {
    width: '100%',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  meta: {
    flex: 1,
    paddingRight: 16,
  },
});
