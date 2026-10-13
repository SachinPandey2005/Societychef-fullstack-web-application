import { z } from 'zod';

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['PUSH', 'BANNER', 'COUPON', 'REFERRAL']),
    target_audience: z.enum(['ALL', 'SOCIETY', 'INACTIVE', 'VIP', 'CHEFS', 'NEW_USERS']),
    target_id: z.string().uuid().optional(),
    content: z.string().min(1),
    start_date: z.string().datetime(),
    end_date: z.string().datetime().optional(),
  })
});

export const updateCampaignStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    is_active: z.boolean(),
  })
});
