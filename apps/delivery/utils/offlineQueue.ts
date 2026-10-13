import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderManagementApi } from '../api';

export interface PendingStatusAction {
  id: string;
  orderId: string;
  status: string;
  timestamp: string;
  retryCount: number;
}

const STORAGE_KEY = '@society_chef_offline_order_queue';

class OfflineQueueManager {
  private isProcessing = false;

  async enqueueStatusUpdate(orderId: string, status: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newAction: PendingStatusAction = {
        id: `${orderId}_${status}_${Date.now()}`,
        orderId,
        status,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      // Prevent duplicate status enqueues for same order and status
      const exists = queue.some((q) => q.orderId === orderId && q.status === status);
      if (!exists) {
        queue.push(newAction);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      }
    } catch (e) {
      console.warn('[OfflineQueue] Failed to enqueue action:', e);
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      const remaining: PendingStatusAction[] = [];

      for (const item of queue) {
        try {
          await orderManagementApi.updateOrderStatus(item.orderId, item.status);
        } catch (error) {
          if (item.retryCount < 3) {
            remaining.push({ ...item, retryCount: item.retryCount + 1 });
          }
        }
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.warn('[OfflineQueue] Error processing queue:', e);
    } finally {
      this.isProcessing = false;
    }
  }

  async getQueue(): Promise<PendingStatusAction[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const offlineQueueManager = new OfflineQueueManager();
export default offlineQueueManager;
