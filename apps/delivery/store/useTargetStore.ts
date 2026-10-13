import { create } from 'zustand';

export interface Target {
  id: string;
  target_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  target_deliveries: number;
  completed_deliveries: number;
  projected_earnings: number;
  starts_at: string;
  ends_at: string;
}

export interface Incentive {
  id: string;
  incentive_type: 'PEAK_HOUR' | 'WEEKEND' | 'FESTIVAL' | 'TARGET' | 'REFERRAL' | 'RAIN' | 'SPECIAL_CAMPAIGN';
  title: string;
  amount: number;
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'CLAIMED';
}

interface TargetState {
  targets: Target[];
  incentives: Incentive[];
  isLoading: boolean;
  error: string | null;

  setTargets: (targets: Target[]) => void;
  setIncentives: (incentives: Incentive[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTargetStore = create<TargetState>((set) => ({
  targets: [],
  incentives: [],
  isLoading: false,
  error: null,

  setTargets: (targets: Target[]) => set({ targets, error: null }),
  setIncentives: (incentives: Incentive[]) => set({ incentives, error: null }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

export default useTargetStore;
