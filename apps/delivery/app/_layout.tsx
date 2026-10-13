import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AppProviders } from '../providers';
import { useThemeStore } from '../store/useThemeStore';
import { syncService } from '../services/sync.service';
import { notificationService } from '../services/notification.service';

export default function RootLayout() {
  // Hydrate theme on initial mount and start sync monitoring
  useEffect(() => {
    useThemeStore.getState().hydrate();
    syncService.startSyncMonitoring();
    
    // Register push notification configurations
    notificationService.registerForPushNotificationsAsync();
    const cleanupListeners = notificationService.setupNotificationListeners();

    return () => {
      syncService.stopSyncMonitoring();
      cleanupListeners();
    };
  }, []);

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
