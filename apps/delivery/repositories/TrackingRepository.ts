import { navigationTrackingApi } from '../api';
import { useTrackingStore } from '../store/useTrackingStore';

export class TrackingRepository {
  static async startTrackingSession(orderId: string): Promise<void> {
    const trackingStore = useTrackingStore.getState();
    try {
      const data = await navigationTrackingApi.startTracking(orderId);
      if (data && data.session_id) {
        trackingStore.startSession(orderId, data.session_id);
      }
    } catch (e: any) {
      console.warn('[TrackingRepository] Start session fallback:', e.message);
      trackingStore.startSession(orderId, `local_session_${Date.now()}`);
    }
  }

  static async stopTrackingSession(orderId: string): Promise<void> {
    const trackingStore = useTrackingStore.getState();
    try {
      await navigationTrackingApi.stopTracking(orderId);
    } catch (e: any) {
      console.warn('[TrackingRepository] Stop session fallback:', e.message);
    } finally {
      trackingStore.stopSession();
    }
  }
}

export default TrackingRepository;
