import { create } from 'zustand';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  score: number;
  completed_deliveries: number;
  rating: number;
  name: string;
  is_self: boolean;
}

interface LeaderboardState {
  entries: LeaderboardEntry[];
  currentScope: 'SOCIETY' | 'CITY' | 'REGION' | 'COMPANY';
  isLoading: boolean;
  error: string | null;

  setEntries: (entries: LeaderboardEntry[]) => void;
  setCurrentScope: (scope: 'SOCIETY' | 'CITY' | 'REGION' | 'COMPANY') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  currentScope: 'SOCIETY',
  isLoading: false,
  error: null,

  setEntries: (entries: LeaderboardEntry[]) => set({ entries, error: null }),
  setCurrentScope: (currentScope: 'SOCIETY' | 'CITY' | 'REGION' | 'COMPANY') => set({ currentScope }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

export default useLeaderboardStore;
