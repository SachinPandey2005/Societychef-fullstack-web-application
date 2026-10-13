import { create } from 'zustand';

export type CrmConnectionState = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'WAITING_FOR_ORDERS' | 'RECEIVING_ORDERS';

interface CrmStatusState {
  connectionState: CrmConnectionState;
  syncing: boolean;
  networkStatus: 'EXCELLENT' | 'GOOD' | 'POOR' | 'DISCONNECTED';
  lastSyncTime: Date | null;
  reconnectAttempts: number;
  
  setCrmState: (state: CrmConnectionState) => void;
  setSyncing: (syncing: boolean) => void;
  setNetworkStatus: (status: 'EXCELLENT' | 'GOOD' | 'POOR' | 'DISCONNECTED') => void;
  touchSync: () => void;
  incrementReconnect: () => void;
  resetReconnect: () => void;
}

export const useCrmStatusStore = create<CrmStatusState>((set) => ({
  connectionState: 'CONNECTED',
  syncing: false,
  networkStatus: 'EXCELLENT',
  lastSyncTime: new Date(),
  reconnectAttempts: 0,

  setCrmState: (connectionState: CrmConnectionState) => set({ connectionState, lastSyncTime: new Date() }),
  setSyncing: (syncing: boolean) => set({ syncing }),
  setNetworkStatus: (networkStatus: 'EXCELLENT' | 'GOOD' | 'POOR' | 'DISCONNECTED') => set({ networkStatus }),
  touchSync: () => set({ lastSyncTime: new Date() }),
  incrementReconnect: () => set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnect: () => set({ reconnectAttempts: 0 }),
}));
