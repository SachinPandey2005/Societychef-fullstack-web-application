export type SettlementStatus = 'PENDING' | 'GENERATED' | 'PROCESSING' | 'APPROVED' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface Settlement {
  id: string;
  kitchen_id: string;
  period_start: string;
  period_end: string;
  total_sales: number; // Gross
  platform_commission: number;
  gateway_fees: number;
  taxes: number;
  refund_adjustments: number;
  net_payable: number;
  status: SettlementStatus;
  held_transaction_id?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  kitchens?: {
    id: string;
    name: string;
    chef_name: string;
    phone?: string;
    email?: string;
    societies?: {
      id: string;
      name: string;
    };
  };
  orders_count?: number;
}

export interface SettlementFilterParams {
  query?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  range?: string;
  page?: number;
  limit?: number;
}

export interface SettlementSummaryMetrics {
  pending: { count: number; total_amount: number };
  processing: { count: number; total_amount: number };
  paid: { count: number; total_amount: number };
  failed: { count: number; total_amount: number };
  total_chef_earnings: {
    gross_sales: number;
    platform_commission: number;
    net_payable: number;
    last_settlement_date?: string;
  };
}

export interface SettlementDetailsResponse {
  settlement: Settlement;
  kitchen: any;
  orders: any[];
  financial_summary: {
    gross_sales: number;
    platform_commission: number;
    taxes: number;
    delivery_fee: number;
    gateway_fees: number;
    net_payable: number;
  };
}
