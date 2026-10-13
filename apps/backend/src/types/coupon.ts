export type DiscountType = 'FLAT' | 'PERCENTAGE' | 'FREE_DELIVERY';

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number; // Stored in minor units for FLAT, or 0-100 for PERCENTAGE
  max_discount?: number; // Cap for PERCENTAGE
  min_order_value?: number;
  expiry_date?: string;
  usage_limit?: number;
  current_usage: number;
  is_active: boolean;
  society_id?: string; // Restricted to society
  kitchen_id?: string; // Restricted to kitchen
  created_at?: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  profile_id: string;
  order_id: string;
  discount_applied: number;
  created_at?: string;
}
