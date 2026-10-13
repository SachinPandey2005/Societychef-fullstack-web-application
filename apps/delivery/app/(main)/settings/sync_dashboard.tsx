import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../../components/layout/ScrollableLayout';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/Typography';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/Icon';
import { useOfflineStore } from '../../../store/useOfflineStore';
import { OfflineSyncRepository } from '../../../repositories/OfflineSyncRepository';
import { useToast } from '../../../components/ui/Toast';

export default function SyncDashboardScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();
  const {
    isOnline,
    connectionQuality,
    offlineQueue,
    isSyncing,
    error,
    loadQueue,
  } = useOfflineStore();

  useEffect(() => {
    loadQueue();
  }, []);

  const handleForceSync = async () => {
    if (offlineQueue.length === 0) {
      showToast('No pending offline actions in sync queue.', 'info');
      return;
    }

    if (!isOnline) {
      showToast('Device is currently offline. Cannot sync.', 'error');
      return;
    }

    try {
      await OfflineSyncRepository.syncOfflineActions();
      showToast('Offline actions synchronization completed successfully.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Synchronization failed.', 'error');
    }
  };

  const getConnectionColor = () => {
    if (!isOnline) return colors.danger;
    if (connectionQuality === 'POOR') return colors.warning;
    return colors.primary;
  };

  return (
    <ScreenWrapper edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="md" weight="extrabold">Sync & Resiliency</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollableLayout>
        <View style={{ padding: spacing.md, gap: spacing.md }}>

          {/* Connection Status Card */}
          <Card style={{ padding: spacing.md }}>
            <View style={styles.statusHeader}>
              <View style={styles.statusLabelGroup}>
                <View style={[styles.statusDot, { backgroundColor: getConnectionColor() }]} />
                <Text variant="caption" weight="extrabold" style={{ marginLeft: 8 }}>
                  {!isOnline
                    ? 'Offline Mode'
                    : connectionQuality === 'POOR'
                    ? 'Poor Connection Quality'
                    : 'Online & Synchronized'}
                </Text>
              </View>
              <Text variant="caption" style={{ fontSize: 9, color: colors.textMuted }}>
                SYSTEM STATUS
              </Text>
            </View>
            <Text variant="caption" color="secondary" style={{ marginTop: 6, fontSize: 11 }}>
              {!isOnline
                ? 'Your device is disconnected from internet. Any status changes (pickup, delivery, or support tickets) are queued locally and will synchronize automatically upon reconnection.'
                : connectionQuality === 'POOR'
                ? 'High API network latency is detected (>3000ms). Connection is unstable but retry attempts are active.'
                : 'API endpoints, Supabase realtime channels, and GPS streaming modules are operating normally.'}
            </Text>
          </Card>

          {/* Sync Stats metrics */}
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="secondary" weight="bold">Synchronization Health</Text>
            <Card style={{ padding: spacing.md, gap: spacing.sm }}>
              <View style={styles.metricRow}>
                <Text variant="caption">Pending Offline Actions</Text>
                <Text variant="caption" weight="bold" color={offlineQueue.length > 0 ? 'warning' : 'default'}>
                  {offlineQueue.length} operations queued
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              <View style={styles.metricRow}>
                <Text variant="caption">Syncing State</Text>
                <Text variant="caption" weight="bold" color={isSyncing ? 'primary' : 'secondary'}>
                  {isSyncing ? 'ACTIVE SYNC IN PROGRESS' : 'IDLE'}
                </Text>
              </View>

              {error && (
                <View style={{ marginTop: 8 }}>
                  <Text variant="caption" color="danger" style={{ fontSize: 10 }}>
                    Error details: {error}
                  </Text>
                </View>
              )}
            </Card>
          </View>

          {/* Pending Actions Queue List details */}
          {offlineQueue.length > 0 && (
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="secondary" weight="bold">Pending Operations List</Text>
              {offlineQueue.map((item) => (
                <Card key={item.id} style={{ padding: spacing.md }}>
                  <View style={styles.queueItemHeader}>
                    <Text variant="caption" weight="bold">Order status change</Text>
                    <Text variant="caption" style={{ fontSize: 8, color: colors.textMuted }}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text variant="caption" color="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                    Update Order ID: <Text variant="caption" weight="bold">{item.orderId}</Text> to status <Text variant="caption" weight="bold" color="primary">{item.status}</Text>
                  </Text>
                </Card>
              ))}
            </View>
          )}

          <Button
            label="Force Synchronize Queue"
            onPress={handleForceSync}
            variant="primary"
            size="lg"
            disabled={offlineQueue.length === 0 || isSyncing || !isOnline}
            loading={isSyncing}
            style={{ marginTop: spacing.md }}
          />

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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
