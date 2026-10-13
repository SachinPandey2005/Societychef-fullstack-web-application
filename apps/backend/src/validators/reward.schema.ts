import { z } from 'zod';

export const addPointsSchema = z.object({
  body: z.object({
    profile_id: z.string().uuid(),
    amount: z.number().int().positive(),
    type: z.literal('EARN'),
    source_id: z.string().optional(),
  })
});

export const redeemPointsSchema = z.object({
  body: z.object({
    amount: z.number().int().positive(),
  })
});

export const createReferralSchema = z.object({
  body: z.object({
    referred_id: z.string().uuid(),
  })
});
