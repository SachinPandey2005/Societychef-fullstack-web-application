import { z } from 'zod';

export const createProfileSchema = z.object({
  body: z.object({
    phone: z.string().min(10).max(15),
    name: z.string().min(2).max(100),
    role: z.enum(['consumer', 'chef', 'admin', 'SUPER_ADMIN', 'OPERATIONS', 'SUPPORT_AGENT', 'FINANCE', 'KITCHEN_VERIFIER']),
    avatar_url: z.string().url().optional(),
    society_id: z.string().uuid().optional(),
    notification_preferences: z.any().optional(),
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    avatar_url: z.string().url().optional(),
    society_id: z.string().uuid().optional(),
    notification_preferences: z.any().optional(),
  })
});

export const profileIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Profile ID'),
  })
});
