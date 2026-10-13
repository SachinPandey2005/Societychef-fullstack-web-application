import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    email_opt_in: z.boolean().optional(),
    sms_opt_in: z.boolean().optional(),
    push_opt_in: z.boolean().optional(),
    promotions_opt_in: z.boolean().optional(),
  })
});

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    target_segment: z.string().optional(),
    channel: z.enum(['PUSH', 'IN_APP', 'EMAIL', 'SMS']),
    content_template: z.string().min(5),
    scheduled_at: z.string().datetime().optional(),
  })
});

export const updateCampaignStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'ARCHIVED']),
  })
});
