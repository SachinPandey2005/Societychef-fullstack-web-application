import { create } from 'zustand';

export interface Badge {
  id: string;
  badge_code: string;
  title: string;
  description: string;
  unlocked_at: string;
}

export interface AchievementStateData {
  experience_points: number;
  partner_level: number;
  next_level_xp: number;
  badges: Badge[];
}

interface AchievementState {
  data: AchievementStateData | null;
  isLoading: boolean;
  error: string | null;

  setData: (data: AchievementStateData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAchievementStore = create<AchievementState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  setData: (data: AchievementStateData) => set({ data, error: null }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

export default useAchievementStore;
