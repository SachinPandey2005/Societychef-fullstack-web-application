import { z } from 'zod';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as [string, ...string[]];

export const createWeeklyDishSchema = z.object({
  body: z.object({
    kitchen_id: z.string().uuid(),
    day: z.enum(DAYS),
    dish_name: z.string().min(1).max(100),
    category: z.string().optional(),
    meal_type: z.string().optional(),
    price: z.number().positive(),
    quantity: z.number().int().positive().optional(),
    remaining_quantity: z.number().int().min(0).optional(),
    description: z.string().max(500).optional().nullable(),
    close_time: z.string().optional(),
    // Plain string, not a fixed enum — the app's own vocabulary
    // (active/paused/sold_out/hidden) doesn't match the column's default
    // ('open'), and there's no DB-level CHECK constraint either.
    status: z.string().optional(),
    week_start_date: z.string(),
  })
});

export const updateWeeklyDishSchema = z.object({
  body: z.object({
    day: z.enum(DAYS).optional(),
    dish_name: z.string().min(1).max(100).optional(),
    category: z.string().optional(),
    meal_type: z.string().optional(),
    price: z.number().positive().optional(),
    quantity: z.number().int().positive().optional(),
    remaining_quantity: z.number().int().min(0).optional(),
    description: z.string().max(500).optional().nullable(),
    close_time: z.string().optional(),
    status: z.string().optional(),
    week_start_date: z.string().optional(),
  })
});

export const weeklyDishIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Weekly Dish ID'),
  })
});

export const listWeeklyDishesSchema = z.object({
  query: z.object({
    kitchen_id: z.string().uuid().optional(),
    week_start_date: z.string(),
  })
});
