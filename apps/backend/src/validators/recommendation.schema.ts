import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    favorite_cuisines: z.array(z.string()).optional(),
    dietary_preferences: z.array(z.string()).optional(),
    price_preference: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  })
});

export const submitFeedbackSchema = z.object({
  body: z.object({
    item_id: z.string().uuid(),
    item_type: z.enum(['DISH', 'KITCHEN', 'CHEF', 'COUPON']),
    action: z.enum(['LIKE', 'DISLIKE', 'NOT_INTERESTED']),
  })
});
