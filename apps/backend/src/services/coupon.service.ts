import { CouponRepository } from '../repositories/coupon.repository';
import { DiscountType } from '../types/coupon';
import { ValidationError } from '../utils/errors';

export class CouponService {
  static async createCoupon(code: string, discount_type: DiscountType, discount_value: number, max_discount?: number, min_order_value?: number, expiry_date?: string, usage_limit?: number, society_id?: string, kitchen_id?: string) {
    return CouponRepository.createCoupon({
      code: code.toUpperCase(),
      discount_type,
      discount_value,
      max_discount,
      min_order_value,
      expiry_date,
      usage_limit,
      is_active: true,
      society_id,
      kitchen_id
    });
  }

  static async validateAndCalculate(code: string, order_value: number, profile_id: string, society_id?: string, kitchen_id?: string) {
    const coupon = await CouponRepository.getCouponByCode(code);
    
    if (!coupon) throw new ValidationError('Invalid coupon code');
    if (!coupon.is_active) throw new ValidationError('Coupon is not active');
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) throw new ValidationError('Coupon expired');
    if (coupon.usage_limit && coupon.current_usage >= coupon.usage_limit) throw new ValidationError('Coupon usage limit reached');
    if (coupon.min_order_value && order_value < coupon.min_order_value) throw new ValidationError(`Minimum order value is ${coupon.min_order_value}`);
    if (coupon.society_id && coupon.society_id !== society_id) throw new ValidationError('Coupon not valid for this society');
    if (coupon.kitchen_id && coupon.kitchen_id !== kitchen_id) throw new ValidationError('Coupon not valid for this kitchen');

    let discount = 0;
    if (coupon.discount_type === 'FLAT') {
      discount = coupon.discount_value;
    } else if (coupon.discount_type === 'PERCENTAGE') {
      discount = (order_value * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else if (coupon.discount_type === 'FREE_DELIVERY') {
      discount = 5000; // Flat 50 INR representing delivery
    }

    return { valid: true, discount, coupon_id: coupon.id };
  }
}
