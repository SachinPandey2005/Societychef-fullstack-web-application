import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { ScrollableLayout } from '../../components/layout/ScrollableLayout';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { Text } from '../../components/Typography';
import { Button } from '../../components/ui/Button';

// Stores
import { useAuthStore } from '../../store/useAuthStore';
import { usePartnerStore } from '../../store/usePartnerStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAvailabilityStore, AvailabilityStateMode } from '../../store/useAvailabilityStore';
import { useShiftStore } from '../../store/useShiftStore';
import { useCrmStatusStore } from '../../store/useCrmStatusStore';
import { usePerformanceStore } from '../../store/usePerformanceStore';
import { useVehicleStore } from '../../store/useVehicleStore';

// Repositories
import { DashboardRepository } from '../../repositories/DashboardRepository';
import { AvailabilityRepository } from '../../repositories/AvailabilityRepository';
import { ShiftRepository } from '../../repositories/ShiftRepository';
import { PerformanceRepository } from '../../repositories/PerformanceRepository';
import { EmergencyRepository } from '../../repositories/EmergencyRepository';
import { useLocationStore } from '../../store/useLocationStore';

// Services
import { heartbeatService } from '../../services/heartbeat.service';
import { realtimeHubService } from '../../services/realtimeHub.service';
import { systemCheckService, SystemStatusState } from '../../services/systemCheck.service';

// Dashboard Components
import {
  GreetingHeader,
  AvailabilityToggleCard,
  ShiftManagementCard,
  LiveCrmStatusCard,
  ActiveDeliveryCard,
  AvailableOrdersPreview,
  TodaySummaryGrid,
  PerformanceSnapshotCard,
  QuickActionsBar,
  LiveNotificationsWidget,
  AnnouncementCarousel,
  PromotionBanner,
  MiniMapPreview,
  NetworkStatusBanner,
  SkeletonDashboard,
  EmergencySosModal,
} from '../../components/dashboard';

export default function HomeScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const { showToast } = useToast();

  const { userProfile, partnerProfile } = useAuthStore();
  const { profile: partnerStoreProfile, partner: partnerStorePartner } = usePartnerStore();
  const partnerId = userProfile?.id || 'partner-default';

  // State Stores
  const {
    greeting,
    activeDelivery,
    availableOrders,
    todaySummary,
    announcements,
    liveNotifications,
    promotions,
    isLoading,
    isRefreshing,
  } = useDashboardStore();

  const { status: availStatus, isOnline, isUpdating: availUpdating } = useAvailabilityStore();
  const { shift } = useShiftStore();
  const { connectionState, syncing, networkStatus, lastSyncTime } = useCrmStatusStore();
  const { metrics: perfMetrics } = usePerformanceStore();

  // Local UI Modals & State
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewModalTitle, setPreviewModalTitle] = useState('');
  const [previewModalContent, setPreviewModalContent] = useState('');
  const [systemStatus, setSystemStatus] = useState<SystemStatusState>({
    gpsEnabled: true,
    internetConnected: true,
    realtimeConnected: true,
    batteryLevel: 90,
    locationPermission: 'granted',
  });

  // 1. Initial Data Load & Background Realtime Connection
  useEffect(() => {
    const initDashboard = async () => {
      await DashboardRepository.fetchOverview();
      await AvailabilityRepository.fetchStatus();
      await ShiftRepository.fetchShift();
      await PerformanceRepository.fetchPerformance();
      try {
        await useVehicleStore.getState().loadVehicle();
      } catch (err) {
        console.warn('Failed to load vehicle details in dashboard:', err);
      }
    };

    initDashboard();

    // Start Heartbeat & Realtime Subscription
    heartbeatService.startHeartbeat();
    realtimeHubService.subscribe(partnerId, (title, body) => {
      showToast(`${title}: ${body}`, 'info');
    });

    // Check system status (GPS, Battery, Network)
    systemCheckService.checkSystemHealth().then((status) => {
      setSystemStatus(status);
    });

    const statusInterval = setInterval(() => {
      systemCheckService.checkSystemHealth().then((status) => {
        setSystemStatus(status);
      });
    }, 15000);

    return () => {
      heartbeatService.stopHeartbeat();
      realtimeHubService.unsubscribe();
      clearInterval(statusInterval);
    };
  }, [partnerId]);

  // 2. Refresh Control Handler
  const handleRefresh = useCallback(async () => {
    await DashboardRepository.refreshOverview();
    await ShiftRepository.fetchShift();
    await PerformanceRepository.fetchPerformance();
    showToast('Dashboard updated with live CRM data', 'success');
  }, []);

  // 3. Online / Offline Toggle
  const handleToggleOnline = async () => {
    const nextStatus: AvailabilityStateMode = isOnline ? 'OFFLINE' : 'ONLINE';
    try {
      await AvailabilityRepository.updateStatus(nextStatus);
      showToast(
        nextStatus === 'ONLINE'
          ? 'You are now ONLINE. Listening for assigned orders...'
          : 'You are now OFFLINE. Shifts & orders paused.',
        nextStatus === 'ONLINE' ? 'success' : 'info'
      );
    } catch (e: any) {
      showToast(e.message || 'Failed to update online status', 'error');
    }
  };

  // 4. Select Availability Mode (Online, Busy, Break, Offline)
  const handleSelectStatus = async (newStatus: AvailabilityStateMode) => {
    try {
      await AvailabilityRepository.updateStatus(newStatus);
      showToast(`Duty status updated to ${newStatus}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Status update failed', 'error');
    }
  };

  // 5. Accept Available Order Preview
  const handleAcceptOrder = (orderId: string) => {
    const vehicle = useVehicleStore.getState().vehicle;
    const order = availableOrders.find((o) => o.id === orderId);
    const hasVehicle = !!(vehicle && vehicle.vehicle_type && vehicle.vehicle_type !== 'WALKING');

    if (!hasVehicle && order && (order.priority === 'EXPRESS' || order.distance_km > 2)) {
      showToast('⚠️ Motor vehicle details required for high-priority or long-distance orders. Please add a vehicle in Profile.', 'error');
      return;
    }

    useDashboardStore.getState().removeAvailableOrder(orderId);
    showToast(`Order accepted! Ready for dispatch preview.`, 'success');
  };

  // 6. Navigation / Stub Handlers
  const handleShowPreviewModal = (title: string, content: string) => {
    setPreviewModalTitle(title);
    setPreviewModalContent(content);
    setPreviewModalVisible(true);
  };

  if (isLoading && !greeting) {
    return (
      <ScreenWrapper>
        <SkeletonDashboard />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* 1. Network & Device Status Warning Banner (Top) */}
      <NetworkStatusBanner
        systemStatus={systemStatus}
        onFixGps={() => showToast('Redirecting to location settings...', 'info')}
      />

      <ScrollableLayout
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: spacing.xs }}
      >
        {/* 2. Hero Greeting Card */}
        <GreetingHeader
          greeting={greeting ? {
            ...greeting,
            name: greeting.name || partnerStoreProfile?.name || userProfile?.name || 'New User',
            photo_url: greeting.photo_url || partnerStorePartner?.profile_photo_url || (partnerStoreProfile as any)?.photo_url || undefined,
          } : {
            name: partnerStoreProfile?.name || userProfile?.name || 'New User',
            photo_url: partnerStorePartner?.profile_photo_url || (partnerStoreProfile as any)?.photo_url || undefined,
            is_online: isOnline,
            partner_code: (partnerStorePartner as any)?.partner_code || (partnerProfile as any)?.partner_code || 'DP-0000',
            profile_completion_percentage: partnerStorePartner?.progress_percentage || (partnerProfile as any)?.progress_percentage || 100,
          } as any}
          isOnline={isOnline}
          isUpdating={availUpdating}
          onToggleOnline={handleToggleOnline}
          onPressProfile={() => router.push('/(main)/profile')}
          onPressNotifications={() => router.push('/(main)/notifications')}
          notificationCount={3}
        />

        {/* 3. Coverage Zone Card */}
        <MiniMapPreview
          societyName={greeting?.society?.name || 'Green Meadows Society'}
          hasActiveDelivery={!!activeDelivery}
          onPressViewMap={() => router.push('/(orders)/navigation')}
        />

        {/* 4. Two-Column Dashboard Row (Today's Performance & Active Delivery) */}
        <View style={styles.twoColRow}>
          <TodaySummaryGrid summary={todaySummary} />
          <ActiveDeliveryCard
            activeDelivery={activeDelivery}
            onResumeDelivery={() => router.push('/(orders)/navigation')}
          />
        </View>

        {/* 5. Weekend Target Incentive Banner */}
        <PromotionBanner promotions={promotions} />

        {/* 6. Performance & Level Card */}
        <PerformanceSnapshotCard
          metrics={perfMetrics}
          onPressView={() => router.push('/(main)/performance')}
        />

        {/* 7. Quick Actions 10-Grid */}
        <QuickActionsBar
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          onViewOrders={() => router.push('/(main)/orders')}
          onViewNavigation={() => router.push('/(orders)/navigation')}
          onViewWallet={() => router.push('/(main)/wallet')}
          onViewSupport={() => router.push('/(main)/support')}
          onTriggerSos={() => setSosModalVisible(true)}
          onViewProfile={() => router.push('/(main)/profile')}
          onViewPerformance={() => router.push('/(main)/performance')}
          onViewLeaderboard={() => router.push('/(main)/leaderboard')}
          onViewRewards={() => router.push('/(main)/rewards')}
        />
      </ScrollableLayout>

      {/* Emergency SOS Panic Modal */}
      <EmergencySosModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
        onConfirmSos={async () => {
          setSosModalVisible(false);
          const { currentLocation } = useLocationStore.getState();
          if (currentLocation) {
            try {
              await EmergencyRepository.triggerSOS(
                currentLocation.latitude,
                currentLocation.longitude,
                activeDelivery?.order_id || null
              );
              showToast('EMERGENCY SOS TRANSMITTED! Ops Help is on the way.', 'error');
            } catch (e: any) {
              showToast('Failed to trigger SOS. Contact police/ops directly!', 'error');
            }
          } else {
            showToast('GPS coords not ready. Dial Emergency Helpline: 108', 'error');
          }
        }}
      />

      {/* Feature Preview Overlay Modal */}
      <Modal visible={previewModalVisible} onClose={() => setPreviewModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text variant="h3" weight="extrabold" color="primary">
            {previewModalTitle}
          </Text>
          <Text variant="xs" color="secondary" align="center" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
            {previewModalContent}
          </Text>
          <Button label="Got it" onPress={() => setPreviewModalVisible(false)} variant="primary" size="md" />
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginVertical: 4,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
    padding: 16,
  },
});
