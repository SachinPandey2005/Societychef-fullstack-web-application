export type OrderStatus =
  | 'PENDING'
  // The real orders.status column defaults to 'PLACED', not 'PENDING' — it's
  // what OrderRepository.createDirectOrder and PartyRepository.createPartyOrder
  // actually write for a brand-new order. 'PENDING' is cart-checkout's own
  // (createOrderFromCart/createOrder) convention. Both need to be valid
  // starting states for updateOrderStatus's transition table below.
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export type DeliveryMode = 'PICKUP' | 'DELIVERY';

export interface OrderItem {
  id: string;
  order_id: string;
  // Nullable: a weekly pre-booked dish's id lives in weekly_dishes, not
  // dishes, and order_items.dish_id has a real FK to dishes — so a weekly
  // item is recorded via dish_name_snapshot/price_snapshot only.
  dish_id: string | null;
  // The weekly_dishes row this item was booked from, when dish_id is null —
  // lets cancellation restore the real remaining_quantity it decremented.
  weekly_dish_id?: string | null;
  quantity: number;
  price_at_order: number; // Stored minor units (paise) or flat
  dish_name_snapshot?: string;
  created_at?: string;
  // Snapshot of the dish's add-ons actually selected at order time — see
  // dish_addons (supabase/local/027_dish_addons.sql). Never recomputed from
  // the live dish_addons rows after the fact, same spirit as
  // dish_name_snapshot/price_at_order.
  addons?: { id: string; name: string; price: number }[];
}

export interface Order {
  id: string;
  profile_id: string; // Consumer ID
  customer_id?: string;
  // profile_id/customer_id/consumer_id are overlapping columns from schema
  // drift — different write paths populate different ones (see
  // apps/mobile/services/supabase/index.ts#placeOrder, which only sets
  // customer_id). Kept as optional so ownership checks can look at all three.
  consumer_id?: string;
  kitchen_id: string;
  status: OrderStatus;
  payment_status?: string;
  total_paid?: number;
  razorpay_payment_id?: string;
  delivery_mode: DeliveryMode;
  delivery_partner_id?: string;
  item_total: number;
  discount_amount: number;
  delivery_fee: number;
  taxes: number;
  platform_fee: number;
  grand_total: number;
  platform_commission?: number;
  net_chef_earnings?: number;
  tax_amount?: number;
  created_at?: string;
  updated_at?: string;
}


export interface CreateOrderInput {
  profile_id: string;
  kitchen_id: string;
  delivery_mode: DeliveryMode;
  item_total: number;
  discount_amount: number;
  delivery_fee: number;
  taxes: number;
  platform_fee: number;
  grand_total: number;
}

export type OrderPaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type OrderSettlementStatus = 'PENDING' | 'GENERATED' | 'PROCESSING' | 'PAID' | 'FAILED';
export type OrderPaymentMethod = 'UPI' | 'Card' | 'Net Banking' | 'Wallet' | 'COD';

export interface OrderFilterParams {
  query?: string;
  status?: string;
  payment_status?: string;
  settlement_status?: string;
  payment_method?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderFinancialSummary {
  order_id: string;
  payment_info: {
    order_total: number;
    discount_applied: number;
    delivery_charges: number;
    taxes: number;
    final_amount_paid: number;
    payment_method: string;
    transaction_id: string;
    payment_gateway: string;
    payment_status: OrderPaymentStatus;
    payment_time?: string;
  };
  commission_breakdown: {
    platform_commission_pct: number;
    commission_amount: number;
    gst_amount: number;
    net_platform_revenue: number;
  };
  chef_earnings: {
    gross_order_amount: number;
    commission_deduction: number;
    delivery_deduction: number;
    net_chef_earnings: number;
  };
  settlement_info: {
    settlement_status: OrderSettlementStatus;
    settlement_date?: string;
    settlement_id?: string;
    payout_reference?: string;
    paid_date?: string;
  };
}

