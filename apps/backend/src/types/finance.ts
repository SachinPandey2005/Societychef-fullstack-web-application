export interface FinanceOverview {
  gross_revenue: number; // Total processed
  platform_earnings: number; // Commission collected
  outstanding_settlements: number; // Money owed to chefs
  pending_refunds: number; // Money owed to customers
  taxes_collected: number;
  payment_gateway_fees: number;
}
