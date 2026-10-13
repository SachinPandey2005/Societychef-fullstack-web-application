import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useNotificationStore } from '../store/useNotificationStore';

// Expo Go on SDK 53+ removed remote push notifications support.
// Check if running in Expo Go or Web to prevent Expo Go SDK 53 red box console errors.
const isExpoGo =
  Platform.OS === 'web' ||
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

// Lazy reference to expo-notifications module to prevent top-level module load error in Expo Go
let NotificationsModule: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {
  try {
    NotificationsModule = require('expo-notifications');
    if (NotificationsModule && NotificationsModule.setNotificationHandler) {
      NotificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (err) {
    console.log('[NotificationService] Failed to load expo-notifications module:', err);
  }
}

export const notificationService = {
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    if (isExpoGo || !NotificationsModule) {
      console.log('[NotificationService] Skipped push token registration in Expo Go / Web environment.');
      return null;
    }

    try {
      const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await NotificationsModule.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[NotificationService] Push permission not granted');
        return null;
      }

      // Retrieve Expo Push Token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenData = await NotificationsModule.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      // Register with the backend database
      if (token) {
        await useNotificationStore.getState().registerDeviceToken(token);
      }

      // Setup Android channel configuration
      if (Platform.OS === 'android') {
        await NotificationsModule.setNotificationChannelAsync('default', {
          name: 'default',
          importance: NotificationsModule.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7A',
        });
      }

      return token;
    } catch (error: any) {
      console.warn('[NotificationService] Registration skipped/error:', error?.message || error);
      return null;
    }
  },

  setupNotificationListeners: () => {
    if (isExpoGo || !NotificationsModule) return () => {};

    try {
      // Listen for foreground notifications
      const foregroundSubscription = NotificationsModule.addNotificationReceivedListener(notification => {
        console.log('[NotificationService] Received foreground notification:', notification);
      });

      // Listen for notification taps (deep linking)
      const responseSubscription = NotificationsModule.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        console.log('[NotificationService] Notification tapped payload:', data);
        
        if (data && data.screen) {
          try {
            router.push(data.screen as any);
          } catch (err) {
            console.warn('[NotificationService] Navigation failed:', err);
          }
        }
      });

      return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      };
    } catch (err) {
      console.warn('[NotificationService] Error setting notification listeners:', err);
      return () => {};
    }
  },
};

export default notificationService;
