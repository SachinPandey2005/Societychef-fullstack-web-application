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
import { useDeviceStore } from '../../../store/useDeviceStore';
import { DeviceRepository } from '../../../repositories/DeviceRepository';
import { useToast } from '../../../components/ui/Toast';

export default function DevicesManagementScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();
  const { devices, isLoading } = useDeviceStore();

  // Simulated current device identifier
  const mockCurrentDeviceId = devices[0]?.id || 'this-device-uuid';

  useEffect(() => {
    DeviceRepository.fetchDevices();
  }, []);

  const handleRefresh = async () => {
    await DeviceRepository.fetchDevices();
  };

  const handleForceLogout = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Force Logout Session',
      `Are you sure you want to terminate the active session on "${deviceName}"? This will immediately log that device out of the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await DeviceRepository.logoutDevice(deviceId);
              showToast('Device session terminated.', 'success');
            } catch (e) {
              showToast('Failed to force logout session.', 'error');
            }
          },
        },
      ]
    );
  };

  const handleLogoutOthers = () => {
    Alert.alert(
      'Logout Other Devices',
      'This will terminate all other active login sessions on other tablets or mobile phones. Do you wish to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate All Others',
          style: 'destructive',
          onPress: async () => {
            try {
              await DeviceRepository.logoutAllOthers(mockCurrentDeviceId);
              showToast('All other sessions terminated successfully.', 'success');
            } catch (e) {
              showToast('Failed to terminate session logs.', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Device Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout onRefresh={handleRefresh} refreshing={isLoading}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Alert Warning Box */}
          <Card style={{ backgroundColor: colors.surfaceElevated, padding: spacing.md }}>
            <Text variant="caption" color="secondary" style={{ fontSize: 11 }}>
              If you notice any unfamiliar login histories or device profiles, force logout that session immediately and update your account authentication details.
            </Text>
          </Card>

          {/* Actions Headers */}
          {devices.length > 1 && (
            <Button
              label="Log Out From All Other Devices"
              onPress={handleLogoutOthers}
              variant="outline"
              size="sm"
              style={{ borderColor: colors.danger, alignSelf: 'flex-start' }}
            />
          )}

          {/* Devices List */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="caption" color="secondary" weight="bold">Registered Device Sessions</Text>
            {devices.map((device) => {
              const isThisDevice = device.id === mockCurrentDeviceId;
              return (
                <Card key={device.id} style={{ padding: spacing.md }}>
                  <View style={styles.deviceCardHeader}>
                    <View style={styles.deviceInfoGroup}>
                      <Icon
                        name={device.os_type.toLowerCase().includes('ios') ? 'phone-iphone' : 'phone-android'}
                        size={24}
                        colorType={isThisDevice ? 'primary' : 'textSecondary'}
                      />
                      <View style={{ marginLeft: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text variant="caption" weight="bold">{device.device_name}</Text>
                          {isThisDevice && (
                            <View style={[styles.thisDeviceBadge, { backgroundColor: colors.primaryContainer }]}>
                              <Text variant="caption" weight="extrabold" style={{ fontSize: 8, color: colors.primary }}>
                                THIS DEVICE
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text variant="caption" style={{ fontSize: 10, color: colors.textMuted }}>
                          {device.os_type} • App Version {device.app_version}
                        </Text>
                      </View>
                    </View>

                    {!isThisDevice && (
                      <Pressable
                        onPress={() => handleForceLogout(device.id, device.device_name)}
                        style={[styles.logoutBtn, { borderColor: colors.outlineVariant }]}
                      >
                        <Icon name="block" size={16} color={colors.danger} />
                      </Pressable>
                    )}
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.outlineVariant, marginVertical: 8 }]} />

                  <View style={styles.timestampGrid}>
                    <View>
                      <Text variant="caption" style={{ fontSize: 8, color: colors.textMuted }}>LAST LOGIN</Text>
                      <Text variant="caption" style={{ fontSize: 10 }}>
                        {new Date(device.last_login_at).toLocaleDateString()} {new Date(device.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View>
                      <Text variant="caption" style={{ fontSize: 8, color: colors.textMuted }}>LAST SYNC</Text>
                      <Text variant="caption" style={{ fontSize: 10 }}>
                        {new Date(device.last_sync_at).toLocaleDateString()} {new Date(device.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
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
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thisDeviceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  logoutBtn: {
    borderWidth: 1,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  timestampGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
