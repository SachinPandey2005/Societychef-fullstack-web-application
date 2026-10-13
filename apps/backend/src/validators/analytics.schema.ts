import { z } from 'zod';

export const analyticsFilterSchema = z.object({
  query: z.object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    society_id: z.string().uuid().optional(),
    kitchen_id: z.string().uuid().optional(),
  })
});
