import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    dish_id: z.string().uuid(),
    quantity: z.number().int().positive().max(50),
  })
});

export const updateCartItemSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Cart Item ID'),
  }),
  body: z.object({
    quantity: z.number().int().positive().max(50),
  })
});

export const cartItemIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Cart Item ID'),
  })
});
