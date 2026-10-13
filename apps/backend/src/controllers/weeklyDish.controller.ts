import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { WeeklyDishRepository } from '../repositories/weeklyDish.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import {
  createWeeklyDishSchema,
  updateWeeklyDishSchema,
  weeklyDishIdSchema,
  listWeeklyDishesSchema,
} from '../validators/weeklyDish.schema';

export const getWeeklyDish = asyncHandler(async (req: Request, res: Response) => {
  const dish = await WeeklyDishRepository.findById(String(req.params.id));
  if (!dish) throw new NotFoundError('Weekly dish not found');
  sendSuccess(res, 'Weekly dish retrieved successfully', dish);
});

/**
 * With kitchen_id: a kitchen's own planner for that week (all statuses) —
 * public, same convention as GET /dishes?kitchen_id=X. Without it: every
 * active weekly dish across all kitchens for that week, joined with kitchen
 * info — the consumer-facing feed (replaces a direct Supabase query in
 * services/supabase/weeklyDishes.ts#getWeeklyDishesForConsumer, which
 * stopped seeing real data once this table moved to Drizzle/local Postgres).
 */
export const getWeeklyDishes = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listWeeklyDishesSchema.parse({ query: req.query });
  const dishes = query.kitchen_id
    ? await WeeklyDishRepository.findByKitchenAndWeek(query.kitchen_id, query.week_start_date)
    : await WeeklyDishRepository.findActiveForWeek(query.week_start_date);
  sendSuccess(res, 'Weekly dishes retrieved successfully', dishes);
});

export const createWeeklyDish = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createWeeklyDishSchema.parse({ body: req.body });

  // Same force-ownership pattern as createDish/createKitchen — kitchen_id in
  // the body is never trusted for a non-admin caller.
  if (req.user!.role !== 'admin') {
    const ownKitchen = await KitchenRepository.findByChefUserId(req.user!.id);
    if (!ownKitchen) {
      throw new NotFoundError('You do not have a kitchen yet.');
    }
    body.kitchen_id = ownKitchen.id;
  }

  if (body.remaining_quantity === undefined) {
    body.remaining_quantity = body.quantity ?? 10;
  }

  const dish = await WeeklyDishRepository.create(body);
  sendSuccess(res, 'Weekly dish created successfully', dish, 201);
});

export const updateWeeklyDish = asyncHandler(async (req: Request, res: Response) => {
  const { params } = weeklyDishIdSchema.parse({ params: req.params });
  const { body } = updateWeeklyDishSchema.parse({ body: req.body });
  const dish = await WeeklyDishRepository.update(params.id, body);
  if (!dish) throw new NotFoundError('Weekly dish not found');
  sendSuccess(res, 'Weekly dish updated successfully', dish);
});

export const deleteWeeklyDish = asyncHandler(async (req: Request, res: Response) => {
  const { params } = weeklyDishIdSchema.parse({ params: req.params });
  await WeeklyDishRepository.delete(params.id);
  sendSuccess(res, 'Weekly dish deleted successfully', {});
});
