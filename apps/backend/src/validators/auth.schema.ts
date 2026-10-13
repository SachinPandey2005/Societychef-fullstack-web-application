import { z } from 'zod';

export const updateAuthProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    avatar_url: z.string().url().optional(),
    cover_image: z.string().url().optional(),
    society_id: z.string().uuid().optional(),
    society: z.string().min(1).max(200).optional(),
    flat: z.string().min(1).max(50).optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    notification_preferences: z.any().optional(),
    // First-time onboarding role choice ((auth)/role.tsx) — deliberately
    // restricted to these two values only. admin/ops/etc are never
    // self-selectable through this endpoint (see createKitchen's own
    // separate, kitchen-creation-triggered promotion to 'chef' for the
    // other place a role can change).
    role: z.enum(['consumer', 'chef']).optional(),
    roles: z.array(z.enum(['consumer', 'chef'])).optional(),
    active_role: z.enum(['consumer', 'chef']).optional(),
  })
});

export const sendOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+91\d{10}$/, 'Must be a valid Indian phone number starting with +91')
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+91\d{10}$/, 'Must be a valid Indian phone number starting with +91'),
    token: z.string().min(5).max(6, 'OTP must be 5 or 6 digits')
  })
});

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Must be a valid email address'),
    password: z.string().min(1, 'Password is required')
  })
});
