import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { coupons, couponUsage } from '../db/schema';
import { rowToSnakeCase } from '../db/caseMapper';
import { Coupon, CouponUsage } from '../types/coupon';

// coupons.starts_at/ends_at were NOT NULL with no default and nothing in
// this file ever set them — every createCoupon call failed outright against
// the real database. discount_type's CHECK also only allowed
// 'PERCENTAGE'/'FIXED', rejecting the 'FLAT'/'FREE_DELIVERY' paths
// coupon.service.ts's own logic branches on. coupon_usage and
// increment_coupon_usage() didn't exist at all. All fixed via
// supabase/local/006_coupon_system_columns.sql — see that file for the full
// list. recordUsage's increment is now a single atomic UPDATE instead of an
// RPC call.
export class CouponRepository {
  static async createCoupon(coupon: Omit<Coupon, 'id' | 'created_at' | 'current_usage'>): Promise<Coupon> {
    const rows = await db
      .insert(coupons)
      .values({
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        maxDiscount: coupon.max_discount,
        minOrderValue: coupon.min_order_value,
        endsAt: coupon.expiry_date,
        usageLimit: coupon.usage_limit,
        isActive: coupon.is_active,
        societyId: coupon.society_id,
        kitchenId: coupon.kitchen_id,
      })
      .returning();
    return rowToSnakeCase<Coupon>(rows[0]);
  }

  static async getCouponByCode(code: string): Promise<Coupon | null> {
    const rows = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
    if (!rows[0]) return null;
    const mapped = rowToSnakeCase<any>(rows[0]);
    mapped.expiry_date = mapped.ends_at;
    return mapped as Coupon;
  }

  static async recordUsage(usage: Omit<CouponUsage, 'id' | 'created_at'>): Promise<void> {
    await db.insert(couponUsage).values({
      couponId: usage.coupon_id,
      profileId: usage.profile_id,
      orderId: usage.order_id,
      discountApplied: usage.discount_applied,
    });

    await db
      .update(coupons)
      .set({ currentUsage: sql`${coupons.currentUsage} + 1` })
      .where(eq(coupons.id, usage.coupon_id));
  }
}
