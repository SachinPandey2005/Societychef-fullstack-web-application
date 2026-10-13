import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    order_id: z.string().uuid(),
    kitchen_id: z.string().min(1),
    kitchen_name: z.string().optional(),
    dish_id: z.string().optional(),
    dish_name: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
  })
});
