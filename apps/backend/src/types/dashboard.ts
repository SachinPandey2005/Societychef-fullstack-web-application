export interface DashboardStats {
  total_users: number;
  total_chefs: number;
  verified_chefs: number;
  pending_verification: number;
  todays_orders: number;
  todays_revenue: number;
  pending_refunds: number;
  open_tickets: number;
  open_complaints: number;
  failed_payments: number;
  suspended_users: number;
  kitchen_approvals_today: number;
  recent_activity?: any[];
  recent_kitchens?: any[];
  recent_consumers?: any[];
}

export type DateRangeOption = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom';

export interface DateRangeFilter {
  range: DateRangeOption;
  startDate?: string;
  endDate?: string;
}

export interface FinanceSummaryData {
  todays_revenue: { amount: number; growth_vs_yesterday: number };
  todays_orders: { total: number; completed: number; pending: number; cancelled: number };
  pending_chef_payouts: { pending_count: number; pending_amount: number };
  platform_commission: { today: number; weekly: number; monthly: number };
  chef_earnings: { total: number; pending: number; paid: number };
  monthly_revenue: { amount: number; monthly_growth: number };
}

export interface RevenueAnalyticsPoint {
  label: string;
  date: string;
  revenue: number;
  platform_commission: number;
  chef_earnings: number;
}

export interface OrdersSummaryData {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  order_success_rate: number;
}

export interface PaymentSummaryData {
  totals: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    refunded: number;
  };
  breakdown: {
    upi: number;
    card: number;
    net_banking: number;
    wallet: number;
    cod: number;
  };
}

export interface SettlementsSummaryData {
  counts: {
    pending: number;
    processing: number;
    paid: number;
    failed: number;
  };
  amounts: {
    pending: number;
    processing: number;
    paid: number;
    failed: number;
  };
}

export interface TopChefData {
  chef_id: string;
  chef_name: string;
  kitchen_name: string;
  society_name: string;
  orders_count: number;
  total_revenue: number;
  platform_commission: number;
  net_earnings: number;
}

export interface TopSocietyData {
  society_id: string;
  society_name: string;
  city: string;
  orders_count: number;
  total_revenue: number;
  active_customers: number;
  active_chefs: number;
}

export interface FinancialActivityItem {
  id: string;
  event_type: 'CUSTOMER_PAYMENT' | 'SETTLEMENT_GENERATED' | 'SETTLEMENT_PAID' | 'COMMISSION_CALCULATED' | 'REFUND_ISSUED';
  timestamp: string;
  order_id?: string;
  amount: number;
  status: string;
  related_user: string;
  description: string;
}

export interface PerformanceMetricsData {
  avg_order_value: number;
  avg_chef_earnings: number;
  avg_commission: number;
  order_success_rate: number;
  payment_success_rate: number;
  settlement_success_rate: number;
}

