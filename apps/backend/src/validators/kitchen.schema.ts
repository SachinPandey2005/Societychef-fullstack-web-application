import { z } from 'zod';

const operatingHoursSchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  days: z.array(z.string()).min(1),
});

export const createKitchenSchema = z.object({
  body: z.object({
    chef_user_id: z.string().uuid(),
    name: z.string().min(2).max(100),
    chef_name: z.string().min(2).max(100),
    address: z.string().optional(),
    society_id: z.string().uuid().optional(),
    tower: z.string().optional(),
    flat: z.string().optional(),
    hide_identity: z.boolean().default(false),
    default_lead_time_minutes: z.number().positive().max(1000).default(120),
    bank_status: z.string().default('pending'),
    hygiene_status: z.string().default('pending'),
    is_verified: z.boolean().default(false),
    is_top_rated: z.boolean().default(false),
    is_live: z.boolean().default(false),
    // Plain .string(), not .url() — dashboard.tsx clears a cover image by
    // sending '' (empty string), which .url() would reject.
    cover_image: z.string().optional(),
    profile_image: z.string().optional(),
    bio: z.string().optional(),
    specialty: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    story_prompts: z.any().optional(),
    hygiene_details: z.any().optional(),
    trust_badges: z.any().optional(),
    kitchen_info: z.any().optional(),
    stats: z.any().optional(),
  })
});

export const updateKitchenSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    chef_name: z.string().min(2).max(100).optional(),
    address: z.string().optional(),
    society_id: z.string().uuid().optional(),
    tower: z.string().optional(),
    flat: z.string().optional(),
    hide_identity: z.boolean().optional(),
    default_lead_time_minutes: z.number().positive().max(1000).optional(),
    bank_status: z.string().optional(),
    hygiene_status: z.string().optional(),
    is_verified: z.boolean().optional(),
    is_top_rated: z.boolean().optional(),
    is_live: z.boolean().optional(),
    cover_image: z.string().optional(),
    profile_image: z.string().optional(),
    bio: z.string().optional(),
    specialty: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    story_prompts: z.any().optional(),
    hygiene_details: z.any().optional(),
    trust_badges: z.any().optional(),
    kitchen_info: z.any().optional(),
    stats: z.any().optional(),
  })
});

export const kitchenIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Kitchen ID'),
  })
});
