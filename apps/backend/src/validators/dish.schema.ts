import { z } from 'zod';

export const createDishSchema = z.object({
  body: z.object({
    kitchen_id: z.string().uuid(),
    name: z.string().min(2).max(100),
    // Plain text, not a fixed enum — the mobile chef menu uses this for a
    // cuisine-style tag ("North Indian", "Homestyle", ...), not a meal-time
    // category, and `dishes.category` itself has no DB-level CHECK
    // constraint. Nothing in the backend filters on specific values.
    category: z.string().min(1).max(100).default('Homestyle'),
    price: z.number().positive(),
    description: z.string().max(500).optional(),
    image_url: z.string().optional(),
    is_available: z.boolean().default(true),
    diet_type: z.enum(['VEG', 'NONVEG']).optional(),
    prep_time_minutes: z.number().int().positive().optional(),
    tags: z.array(z.string()).optional(),
    is_free: z.boolean().optional(),
  })
});

export const updateDishSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    category: z.string().min(1).max(100).optional(),
    price: z.number().positive().optional(),
    description: z.string().max(500).optional(),
    image_url: z.string().optional(),
    is_available: z.boolean().optional(),
    diet_type: z.enum(['VEG', 'NONVEG']).optional(),
    prep_time_minutes: z.number().int().positive().optional(),
    tags: z.array(z.string()).optional(),
    is_free: z.boolean().optional(),
  })
});

export const dishIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Dish ID'),
  })
});
