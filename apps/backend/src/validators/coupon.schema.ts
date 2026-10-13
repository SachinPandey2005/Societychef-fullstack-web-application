import { z } from 'zod';

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    discount_type: z.enum(['FLAT', 'PERCENTAGE', 'FREE_DELIVERY']),
    discount_value: z.number().positive(),
    max_discount: z.number().positive().optional(),
    min_order_value: z.number().positive().optional(),
    expiry_date: z.string().datetime().optional(),
    usage_limit: z.number().int().positive().optional(),
    society_id: z.string().uuid().optional(),
    kitchen_id: z.string().uuid().optional(),
  })
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    order_value: z.number().positive(),
    society_id: z.string().uuid().optional(),
    kitchen_id: z.string().uuid().optional(),
  })
});
