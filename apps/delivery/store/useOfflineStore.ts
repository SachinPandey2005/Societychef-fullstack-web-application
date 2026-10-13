import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncActionPayload } from '../api/sync.api';

const OFFLINE_QUEUE_KEY = '@society_chef_offline_actions_queue';

interface OfflineState {
  isOnline: boolean;
  connectionQuality: 'GOOD' | 'POOR' | 'DISCONNECTED';
  offlineQueue: SyncActionPayload[];
  isSyncing: boolean;
  error: string | null;

  setOnlineStatus: (isOnline: boolean, quality?: 'GOOD' | 'POOR' | 'DISCONNECTED') => void;
  loadQueue: () => Promise<void>;
  enqueueAction: (orderId: string, status: string) => Promise<void>;
  setOfflineQueue: (queue: SyncActionPayload[]) => void;
  setSyncing: (isSyncing: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  connectionQuality: 'GOOD',
  offlineQueue: [],
  isSyncing: false,
  error: null,

  setOnlineStatus: (isOnline, quality = 'GOOD') => {
    set({
      isOnline,
      connectionQuality: isOnline ? quality : 'DISCONNECTED',
    });
  },

  loadQueue: async () => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const offlineQueue = raw ? JSON.parse(raw) : [];
      set({ offlineQueue });
    } catch (e) {
      console.warn('[OfflineStore] Failed to load queue:', e);
    }
  },

  enqueueAction: async (orderId, status) => {
    const { offlineQueue } = get();
    const newAction: SyncActionPayload = {
      id: `${orderId}_${status}_${Date.now()}`,
      orderId,
      status,
      timestamp: new Date().toISOString(),
    };

    // Filter duplicate actions of the same order and status
    const exists = offlineQueue.some((a) => a.orderId === orderId && a.status === status);
    if (!exists) {
      const updatedQueue = [...offlineQueue, newAction];
      set({ offlineQueue: updatedQueue });
      try {
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      } catch (e) {
        console.warn('[OfflineStore] Failed to write queue to cache:', e);
      }
    }
  },

  setOfflineQueue: (offlineQueue) => {
    set({ offlineQueue });
    AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue)).catch((e) => {
      console.warn('[OfflineStore] Failed to write queue to cache:', e);
    });
  },

  setSyncing: (isSyncing) => set({ isSyncing }),
  setError: (error) => set({ error }),
}));

export default useOfflineStore;
