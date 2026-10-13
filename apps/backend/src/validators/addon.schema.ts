import { z } from 'zod';

export const dishAddonParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Dish ID'),
  })
});

export const addonIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Dish ID'),
    addonId: z.string().uuid('Invalid Add-on ID'),
  })
});

export const createAddonSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Dish ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100),
    price: z.number().nonnegative(),
  })
});

export const updateAddonSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Dish ID'),
    addonId: z.string().uuid('Invalid Add-on ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    price: z.number().nonnegative().optional(),
  })
});
