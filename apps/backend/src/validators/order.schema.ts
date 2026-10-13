import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    delivery_mode: z.enum(['PICKUP', 'DELIVERY']),
  })
});

export const orderStatusTransitionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Order ID'),
  }),
  body: z.object({
    status: z.enum([
      'ACCEPTED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REJECTED'
    ]),
  })
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Order ID'),
  })
});

export const createDirectOrderSchema = z.object({
  body: z.object({
    kitchen_id: z.string().uuid(),
    // One or more dishes from this same kitchen, checked out as a single
    // order — previously a single dish_id/quantity pair, which forced a
    // multi-item cart checkout to call this endpoint once per item (N
    // separate orders instead of one). See OrderService.createDirectOrder.
    items: z.array(z.object({
      dish_id: z.string().uuid(),
      quantity: z.number().int().positive(),
      // Only ids — name/price are always looked up server-side from the
      // dish's real add-ons, never trusted from the client (same principle
      // as the rest of this endpoint's pricing).
      addon_ids: z.array(z.string().uuid()).default([]),
    })).min(1),
    consumer_society: z.string().min(1),
    delivery_method: z.enum(['PICKUP', 'DELIVERY_PARTNER']),
    delivery_address: z.string().min(1),
    allergy_tags: z.array(z.string()).default([]),
    allergy_other_text: z.string().optional(),
  })
});
