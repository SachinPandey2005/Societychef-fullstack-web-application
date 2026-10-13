import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { CouponService } from '../services/coupon.service';
import { sendSuccess } from '../utils/response';
import { createCouponSchema, validateCouponSchema } from '../validators/coupon.schema';

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createCouponSchema.parse({ body: req.body });
  const coupon = await CouponService.createCoupon(
    body.code, body.discount_type, body.discount_value, 
    body.max_discount, body.min_order_value, body.expiry_date, 
    body.usage_limit, body.society_id, body.kitchen_id
  );
  sendSuccess(res, 'Coupon created', coupon, 201);
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = validateCouponSchema.parse({ body: req.body });
  const result = await CouponService.validateAndCalculate(
    body.code, body.order_value, profile_id, body.society_id, body.kitchen_id
  );
  sendSuccess(res, 'Coupon validated', result);
});
