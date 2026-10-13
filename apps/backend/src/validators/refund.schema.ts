import { z } from 'zod';

export const createRefundRequestSchema = z.object({
  body: z.object({
    order_id: z.string().uuid(),
    customer_id: z.string().uuid(),
    payment_id: z.string().uuid(),
    amount: z.number().int().positive(),
    reason: z.string().min(1),
  })
});

export const processRefundSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejection_reason: z.string().optional(),
  })
});
