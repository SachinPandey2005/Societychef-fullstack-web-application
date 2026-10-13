import { create } from 'zustand';

export interface GreetingData {
  partner_id: string;
  partner_code: string;
  name: string;
  photo_url: string | null;
  society: {
    id: string;
    name: string;
    city: string;
    area: string;
  };
  current_status: 'OFFLINE' | 'ONLINE' | 'BUSY' | 'DELIVERING' | 'BREAK';
  is_online: boolean;
  profile_completion_percentage: number;
}

export interface ActiveDeliveryData {
  order_id: string;
  order_number: string;
  pickup_address: string;
  kitchen_name: string;
  drop_address: string;
  customer_name: string;
  customer_phone: string;
  eta_minutes: number;
  progress_percentage: number;
  status: string;
}

export interface AvailableOrderPreview {
  id: string;
  order_number: string;
  distance_km: number;
  estimated_earnings: number;
  delivery_time_minutes: number;
  priority: 'EXPRESS' | 'NORMAL' | 'SURGE';
  kitchen_name: string;
}

export interface TodaySummaryData {
  today_earnings: number;
  today_deliveries: number;
  total_distance_km: number;
  hours_online: number;
  avg_delivery_time_minutes: number;
  customer_rating: number;
  acceptance_rate: number;
  completion_rate: number;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: 'BONUS' | 'POLICY' | 'WEATHER' | 'MAINTENANCE' | 'ALERT';
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface PromotionData {
  today_bonus_earned: number;
  weekend_incentive_target: number;
  weekend_incentive_current: number;
  weekend_incentive_reward: number;
  peak_hour_bonus_active: boolean;
}

interface DashboardState {
  greeting: GreetingData | null;
  activeDelivery: ActiveDeliveryData | null;
  availableOrders: AvailableOrderPreview[];
  todaySummary: TodaySummaryData | null;
  announcements: AnnouncementItem[];
  liveNotifications: NotificationItem[];
  promotions: PromotionData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetchedAt: Date | null;

  setDashboardData: (data: any) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  removeAvailableOrder: (orderId: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  greeting: null,
  activeDelivery: null,
  availableOrders: [],
  todaySummary: null,
  announcements: [],
  liveNotifications: [],
  promotions: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetchedAt: null,

  setDashboardData: (data: any) =>
    set({
      greeting: data.greeting || null,
      activeDelivery: data.active_delivery || null,
      availableOrders: data.available_orders || [],
      todaySummary: data.today_summary || null,
      announcements: data.announcements || [],
      liveNotifications: data.live_notifications || [],
      promotions: data.promotions || null,
      error: null,
      lastFetchedAt: new Date(),
    }),

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setRefreshing: (isRefreshing: boolean) => set({ isRefreshing }),
  setError: (error: string | null) => set({ error }),
  removeAvailableOrder: (orderId: string) =>
    set((state) => ({
      availableOrders: state.availableOrders.filter((o) => o.id !== orderId),
    })),
}));
