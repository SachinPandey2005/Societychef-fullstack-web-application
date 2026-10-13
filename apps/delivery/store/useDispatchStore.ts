import { create } from 'zustand';

export interface BatchStopItem {
  stop_number: number;
  type: 'PICKUP' | 'DROP';
  location_name: string;
  address: string;
  order_number: string;
  status: 'PENDING' | 'COMPLETED';
}

interface DispatchState {
  isBatched: boolean;
  batchStops: BatchStopItem[];
  currentStopIndex: number;
  offlineQueueCount: number;
  cancellationNotice: { title: string; reason: string; orderNumber: string } | null;

  setBatchData: (isBatched: boolean, stops: BatchStopItem[]) => void;
  advanceBatchStop: () => void;
  setOfflineQueueCount: (count: number) => void;
  setCancellationNotice: (notice: { title: string; reason: string; orderNumber: string } | null) => void;
}

export const useDispatchStore = create<DispatchState>((set) => ({
  isBatched: false,
  batchStops: [],
  currentStopIndex: 0,
  offlineQueueCount: 0,
  cancellationNotice: null,

  setBatchData: (isBatched: boolean, batchStops: BatchStopItem[]) =>
    set({ isBatched, batchStops, currentStopIndex: 0 }),

  advanceBatchStop: () =>
    set((state) => ({
      currentStopIndex: Math.min(state.batchStops.length - 1, state.currentStopIndex + 1),
    })),

  setOfflineQueueCount: (offlineQueueCount: number) => set({ offlineQueueCount }),

  setCancellationNotice: (cancellationNotice) => set({ cancellationNotice }),
}));
