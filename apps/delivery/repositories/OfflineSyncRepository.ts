import { syncApi } from '../api/sync.api';
import { useOfflineStore } from '../store/useOfflineStore';

export class OfflineSyncRepository {
  static async syncOfflineActions(): Promise<void> {
    const store = useOfflineStore.getState();
    if (store.offlineQueue.length === 0 || store.isSyncing) return;

    store.setSyncing(true);
    let attempts = 0;
    const maxAttempts = 3;
    let delay = 1000; // Start with 1 second delay

    while (attempts < maxAttempts) {
      try {
        const payload = [...store.offlineQueue];
        const res = await syncApi.syncQueue(payload);
        if (res && res.syncedIds) {
          // Sync succeeded, remove synced items
          const remaining = store.offlineQueue.filter((a) => !res.syncedIds.includes(a.id));
          store.setOfflineQueue(remaining);
          store.setError(null);
          break;
        }
        throw new Error('Sync response did not return synced IDs');
      } catch (e: any) {
        attempts++;
        console.warn(`[OfflineSyncRepository] Sync attempt ${attempts} failed:`, e.message);
        if (attempts >= maxAttempts) {
          store.setError(`Synchronization failed: ${e.message}`);
        } else {
          // Exponential backoff wait
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
    store.setSyncing(false);
  }

  static async enqueueOfflineStatus(orderId: string, status: string): Promise<void> {
    const store = useOfflineStore.getState();
    await store.enqueueAction(orderId, status);
  }
}

export default OfflineSyncRepository;
