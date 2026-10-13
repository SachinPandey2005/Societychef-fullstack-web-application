import { z } from 'zod';

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    order_id: z.string().uuid(),
  })
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  })
});

export const createCashfreeOrderSchema = z.object({
  body: z.object({
    order_id: z.string().min(1, 'order_id is required'),
    amount: z.number().positive().optional(),
    associated_order_ids: z.array(z.string()).optional(),
    customer_phone: z.string().optional(),
    customer_name: z.string().optional(),
    customer_email: z.string().email().optional(),
  })
});

export const verifyCashfreePaymentSchema = z.object({
  body: z.object({
    order_id: z.string().min(1, 'order_id is required'),
    cf_order_id: z.string().optional(),
  })
});

export const paymentIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invalid Payment ID'),
  })
});
