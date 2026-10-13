import { useDispatchStore } from '../store/useDispatchStore';
import { offlineQueueManager } from '../utils/offlineQueue';

export class DispatchRepository {
  static async syncOfflineQueue(): Promise<void> {
    const dispatchStore = useDispatchStore.getState();
    await offlineQueueManager.processQueue();
    const remaining = await offlineQueueManager.getQueue();
    dispatchStore.setOfflineQueueCount(remaining.length);
  }
}

export default DispatchRepository;
