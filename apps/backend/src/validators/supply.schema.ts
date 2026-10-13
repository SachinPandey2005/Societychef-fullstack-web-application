import { z } from 'zod';

export const createSupplyOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      supply_item_id: z.string().uuid(),
      quantity: z.number().int().positive(),
    })).min(1),
  })
});
