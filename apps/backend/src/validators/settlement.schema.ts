import { z } from 'zod';

export const generateSettlementSchema = z.object({
  body: z.object({
    kitchen_id: z.string().uuid(),
    period_start: z.string().datetime(),
    period_end: z.string().datetime(),
  })
});

export const updateSettlementStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'PAID', 'FAILED']),
  })
});
