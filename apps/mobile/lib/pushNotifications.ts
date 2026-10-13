import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiClient } from './apiClient';

// Foreground notifications previously had no handler at all, so on iOS a
// push arriving while the app was open would show nothing. Android 8+ also
// needs an explicit notification channel or push delivery is silently
// dropped there too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests permission, gets this device's Expo push token, and registers it
 * with the backend (POST /notifications/device/register — already real,
 * already wired into every NotificationService.sendNotification call this
 * session has used; the only missing piece was ever this registration step
 * on the mobile side). Safe to call multiple times — Expo returns the same
 * token for the same device/app install, and the backend upserts on it.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push tokens aren't issued to simulators/emulators.
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7a1515',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('[pushNotifications] No EAS projectId configured — cannot request an Expo push token.');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await apiClient.post('/notifications/device/register', { token });
    return token;
  } catch (err) {
    console.warn('[pushNotifications] Failed to register for push notifications:', err);
    return null;
  }
}
