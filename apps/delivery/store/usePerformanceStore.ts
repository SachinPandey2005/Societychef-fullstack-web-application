import { create } from 'zustand';

export interface PerformanceMetrics {
  overall_rating: number;
  acceptance_rate: number;
  completion_rate: number;
  on_time_delivery_rate: number;
  avg_delivery_time_minutes: number;
  today_score: number;
  weekly_score: number;
  monthly_score: number;
  lifetime_deliveries: number;
  
  // Attendance Summary
  days_worked: number;
  hours_online: number;
  shift_completion_rate: number;
  late_starts_count: number;
  break_compliance_rate: number;

  // Quality Metrics
  package_handling_score: number;
  customer_satisfaction_score: number;
  order_accuracy_score: number;
  professionalism_score: number;

  // Backward compatibility
  rating?: number;
  level?: string;
  level_number?: number;
  experience_points?: number;
  next_level_xp?: number;
  badges?: string[];
}

export interface PenaltyRecord {
  id: string;
  penalty_type: 'LATE_DELIVERY' | 'CANCELLED_DELIVERY' | 'POLICY_VIOLATION';
  amount: number;
  reason: string;
  warning_issued: boolean;
  status: 'APPLIED' | 'APPEALED' | 'WAIVED';
  appeal_reason: string | null;
  created_at: string;
}

export interface PerformanceTrendPoint {
  label: string;
  score: number;
}

export interface PerformanceTrends {
  daily: PerformanceTrendPoint[];
  weekly: PerformanceTrendPoint[];
  monthly: PerformanceTrendPoint[];
}

interface PerformanceState {
  metrics: PerformanceMetrics | null;
  trends: PerformanceTrends | null;
  penalties: PenaltyRecord[];
  isLoading: boolean;
  error: string | null;

  setMetrics: (metrics: PerformanceMetrics) => void;
  setTrends: (trends: PerformanceTrends) => void;
  setPenalties: (penalties: PenaltyRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  metrics: null,
  trends: null,
  penalties: [],
  isLoading: false,
  error: null,

  setMetrics: (metrics: PerformanceMetrics) => {
    // Map properties for backward compatibility
    const mappedMetrics: PerformanceMetrics = {
      ...metrics,
      rating: metrics.overall_rating,
    };
    set({ metrics: mappedMetrics, error: null });
  },
  setTrends: (trends: PerformanceTrends) => set({ trends }),
  setPenalties: (penalties: PenaltyRecord[]) => set({ penalties }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

export default usePerformanceStore;
