import * as TaskManager from 'expo-task-manager';
import { deliveryApi } from '../../api/delivery.api';
import useAuthStore from '../../store/useAuthStore';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TRACKING';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[BackgroundLocationTask] Task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      const { latitude, longitude } = location.coords;
      console.log(`[BackgroundLocationTask] Location update: ${latitude}, ${longitude}`);

      const auth = useAuthStore.getState();
      if (auth.authStatus === 'authenticated' && auth.partnerProfile?.is_online) {
        try {
          // Push location coordinate directly to backend status
          await deliveryApi.toggleOnlineStatus(true);
        } catch (err) {
          console.warn('[BackgroundLocationTask] Failed to push coordinate updates to backend', err);
        }
      }
    }
  }
});
