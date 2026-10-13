import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationTrackingApi } from '../api';
import { useLocationStore } from '../store/useLocationStore';

const LOCATION_QUEUE_KEY = 'societychef_location_queue';

export interface QueuedLocation {
  assignmentId: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: string;
}

export class LocationRepository {
  static async pushLocation(telemetry: Record<string, any>): Promise<void> {
    try {
      await navigationTrackingApi.updateLocation(telemetry);
    } catch (e) {
      console.warn('[LocationRepository] Push location failed online, queueing offline:', e);
      await this.queueLocationOffline({
        assignmentId: telemetry.assignmentId || 'active-order',
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        heading: telemetry.heading,
        speed: telemetry.speed,
        accuracy: telemetry.accuracy,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async queueLocationOffline(location: QueuedLocation): Promise<void> {
    try {
      const existingQueueStr = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
      const queue: QueuedLocation[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
      queue.push(location);
      await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue));
      console.log(`[LocationRepository] Queued location offline. Queue size: ${queue.length}`);
    } catch (e) {
      console.error('Failed to queue location offline', e);
    }
  }

  static async processOfflineQueue(): Promise<void> {
    const queue = await this.getOfflineQueue();
    if (queue.length === 0) return;

    const remaining: QueuedLocation[] = [];
    for (const item of queue) {
      try {
        await navigationTrackingApi.updateLocation(item);
      } catch {
        remaining.push(item);
      }
    }
    await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(remaining));
  }

  static async getOfflineQueue(): Promise<QueuedLocation[]> {
    try {
      const queueStr = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch {
      return [];
    }
  }

  static async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
  }
}

export default LocationRepository;
