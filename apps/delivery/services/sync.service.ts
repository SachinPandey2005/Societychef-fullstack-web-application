import { LocationRepository, QueuedLocation } from '../repositories/LocationRepository';
import { deliveryApi } from '../api/delivery.api';
import { useOfflineStore } from '../store/useOfflineStore';
import { OfflineSyncRepository } from '../repositories/OfflineSyncRepository';
import { apiClient } from '../api/client';

class SyncService {
  private syncInterval: any = null;
  private isSyncing: boolean = false;

  public startSyncMonitoring(): void {
    if (this.syncInterval) return;

    console.log('[SyncService] Starting background sync check monitor...');
    this.syncInterval = setInterval(async () => {
      await this.checkConnectionQuality();
      await this.flushQueue();
      await this.flushOfflineActions();
    }, 15000); // Check every 15s
  }

  public stopSyncMonitoring(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async checkConnectionQuality(): Promise<void> {
    const store = useOfflineStore.getState();
    const startTime = Date.now();
    try {
      // Fast health check ping to backend
      await apiClient.get('/health');
      const latency = Date.now() - startTime;

      if (latency > 8000) {
        store.setOnlineStatus(true, 'POOR');
      } else {
        store.setOnlineStatus(true, 'GOOD');
      }
    } catch (error) {
      // If health check fails or times out, default to online/good unless NetInfo confirms offline
      store.setOnlineStatus(true, 'GOOD');
    }
  }

  public async flushOfflineActions(): Promise<void> {
    const store = useOfflineStore.getState();
    if (!store.isOnline || store.offlineQueue.length === 0) return;

    console.log(`[SyncService] Reconnected! Syncing ${store.offlineQueue.length} pending status actions...`);
    try {
      await OfflineSyncRepository.syncOfflineActions();
    } catch (e: any) {
      console.warn('[SyncService] Failed to flush offline actions queue:', e.message);
    }
  }

  public async flushQueue(): Promise<void> {
    const store = useOfflineStore.getState();
    if (!store.isOnline) return;

    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const queue = await LocationRepository.getOfflineQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncService] Found ${queue.length} offline coordinates to sync...`);
      const failedToSync: QueuedLocation[] = [];

      for (const item of queue) {
        try {
          // Push to backend
          const lat = item.latitude ?? item.lat ?? 0;
          const lng = item.longitude ?? item.lng ?? 0;
          await deliveryApi.pushTrackingUpdate(item.assignmentId, lat, lng);
        } catch (e) {
          console.warn(`[SyncService] Failed to sync coordinate for assignment ${item.assignmentId}`, e);
          failedToSync.push(item);
        }
      }

      // Overwrite queue with only the failed items to preserve them
      await LocationRepository.clearOfflineQueue();
      for (const failed of failedToSync) {
        await LocationRepository.queueLocationOffline(failed);
      }

      console.log(`[SyncService] Sync round complete. Remaining unsynced: ${failedToSync.length}`);
    } catch (err) {
      console.error('[SyncService] Failed to execute offline sync:', err);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
export default syncService;
