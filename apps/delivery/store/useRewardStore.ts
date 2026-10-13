import { create } from 'zustand';

export interface RewardCatalogItem {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  reward_type: 'COUPON' | 'GIFT_VOUCHER' | 'RECOGNITION_CERTIFICATE';
  image_url: string | null;
}

export interface RedemptionRecord {
  id: string;
  code: string;
  status: 'ISSUED' | 'REDEEMED' | 'EXPIRED';
  redeemed_at: string;
  title: string;
  reward_type: 'COUPON' | 'GIFT_VOUCHER' | 'RECOGNITION_CERTIFICATE';
  points_cost: number;
}

interface RewardState {
  pointsBalance: number;
  totalPointsEarned: number;
  catalog: RewardCatalogItem[];
  redemptions: RedemptionRecord[];
  isLoading: boolean;
  isRedeeming: boolean;
  error: string | null;

  setRewardsData: (data: {
    points_balance: number;
    total_points_earned: number;
    catalog: RewardCatalogItem[];
    redemptions: RedemptionRecord[];
  }) => void;
  setPointsBalance: (balance: number) => void;
  addRedemption: (redemption: RedemptionRecord) => void;
  setLoading: (loading: boolean) => void;
  setRedeeming: (redeeming: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRewardStore = create<RewardState>((set) => ({
  pointsBalance: 0,
  totalPointsEarned: 0,
  catalog: [],
  redemptions: [],
  isLoading: false,
  isRedeeming: false,
  error: null,

  setRewardsData: (data) =>
    set({
      pointsBalance: data.points_balance,
      totalPointsEarned: data.total_points_earned,
      catalog: data.catalog,
      redemptions: data.redemptions,
      error: null,
    }),
  setPointsBalance: (pointsBalance) => set({ pointsBalance }),
  addRedemption: (record) =>
    set((state) => ({ redemptions: [record, ...state.redemptions] })),
  setLoading: (isLoading) => set({ isLoading }),
  setRedeeming: (isRedeeming) => set({ isRedeeming }),
  setError: (error) => set({ error }),
}));

export default useRewardStore;
