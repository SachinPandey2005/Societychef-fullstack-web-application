import { z } from 'zod';

export const createSocietySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    city: z.string().min(2).max(50).optional().default('Metro City'),
    state: z.string().min(2).max(50).optional().default('State Zone'),
    address: z.string().min(2).max(255).optional().default('Central Location'),
    delivery_radius_km: z.number().optional().default(2.5),
    is_active: z.boolean().optional().default(true),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
});

export const updateSocietySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    city: z.string().min(2).max(50).optional(),
    state: z.string().min(2).max(50).optional(),
    address: z.string().min(2).max(255).optional(),
    delivery_radius_km: z.number().optional(),
    is_active: z.boolean().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
});

export const societyIdSchema = z.object({
  params: z.object({
    id: z.string(),
  })
});
