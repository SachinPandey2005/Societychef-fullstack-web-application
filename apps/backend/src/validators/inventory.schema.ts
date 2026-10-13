import { z } from 'zod';

export const createIngredientSchema = z.object({
  body: z.object({
    kitchen_id: z.string().uuid(),
    name: z.string().min(2),
    category: z.string().min(2),
    unit: z.string().min(1),
    cost_per_unit: z.number().positive(),
    shelf_life_days: z.number().int().positive().optional(),
    min_stock_level: z.number().nonnegative().optional().default(0),
  })
});

export const addRecipeIngredientSchema = z.object({
  body: z.object({
    dish_id: z.string().uuid(),
    ingredient_id: z.string().uuid(),
    quantity_required: z.number().positive(),
  })
});

export const adjustStockSchema = z.object({
  body: z.object({
    ingredient_id: z.string().uuid(),
    type: z.enum(['ADD', 'DEDUCT', 'ADJUST']),
    amount: z.number().positive(),
    reason: z.string().optional(),
  })
});

export const logWastageSchema = z.object({
  body: z.object({
    ingredient_id: z.string().uuid(),
    quantity_lost: z.number().positive(),
    reason: z.string().min(3),
  })
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    vendor_name: z.string().min(2),
    total_cost: z.number().positive(),
  })
});
