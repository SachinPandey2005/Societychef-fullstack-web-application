import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RecentlyViewedState = {
  viewedIds: string[];
  addViewedId: (id: string) => void;
  clearViewed: () => void;
};

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      viewedIds: [],
      addViewedId: (id) => {
        const current = get().viewedIds;
        const filtered = current.filter((x) => x !== id);
        // Keep the 6 most recent unique views, new ones at the top
        set({ viewedIds: [id, ...filtered].slice(0, 6) });
      },
      clearViewed: () => set({ viewedIds: [] }),
    }),
    {
      name: 'rasohi-recently-viewed',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
