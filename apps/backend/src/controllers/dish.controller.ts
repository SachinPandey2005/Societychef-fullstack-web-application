import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { DishService } from '../services/dish.service';
import { DishRepository } from '../repositories/dish.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { sendSuccess } from '../utils/response';
import { createDishSchema, updateDishSchema, dishIdSchema } from '../validators/dish.schema';
import { NotFoundError } from '../utils/errors';
import { z } from 'zod';

export const getDishes = asyncHandler(async (req: Request, res: Response) => {
  const kitchenId = req.query.kitchen_id ? String(req.query.kitchen_id) : undefined;
  const dishes = await DishService.getAllDishes(kitchenId);
  sendSuccess(res, 'Dishes retrieved successfully', dishes);
});

/** Consumer discover feed — see DishRepository.getAvailableWithKitchens. */
export const getDiscoverFeed = asyncHandler(async (req: Request, res: Response) => {
  const data = await DishRepository.getAvailableWithKitchens();
  sendSuccess(res, 'Discover feed retrieved successfully', data);
});

export const getDish = asyncHandler(async (req: Request, res: Response) => {
  const { params } = dishIdSchema.parse({ params: req.params });
  const dish = await DishService.getDishById(params.id);
  sendSuccess(res, 'Dish retrieved successfully', dish);
});

export const createDish = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createDishSchema.parse({ body: req.body });

  // dish.routes.ts only required a 'chef'/'admin' role here, not ownership of
  // the kitchen_id in the body — any chef could create a dish under any
  // other kitchen's id. requireDishOwnership (update/delete) can't help on
  // create since there's no dish yet to look up; force kitchen_id to the
  // caller's own kitchen instead, same pattern as createKitchen#chef_user_id.
  if (req.user!.role !== 'admin') {
    const ownKitchen = await KitchenRepository.findByChefUserId(req.user!.id);
    if (!ownKitchen) {
      throw new NotFoundError('You do not have a kitchen yet.');
    }
    body.kitchen_id = ownKitchen.id;
  }

  const dish = await DishService.createDish(body);
  sendSuccess(res, 'Dish created successfully', dish, 201);
});

export const updateDish = asyncHandler(async (req: Request, res: Response) => {
  const { params } = dishIdSchema.parse({ params: req.params });
  const { body } = updateDishSchema.parse({ body: req.body });
  const dish = await DishService.updateDish(params.id, body);
  sendSuccess(res, 'Dish updated successfully', dish);
});

export const toggleDishAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { params } = dishIdSchema.parse({ params: req.params });
  const { is_available } = z.object({ is_available: z.boolean() }).parse(req.body);
  
  const dish = await DishService.toggleAvailability(params.id, is_available);
  sendSuccess(res, 'Dish availability updated successfully', dish);
});

export const archiveDish = asyncHandler(async (req: Request, res: Response) => {
  const { params } = dishIdSchema.parse({ params: req.params });
  const dish = await DishService.archiveDish(params.id);
  sendSuccess(res, 'Dish archived successfully', dish);
});

export const deleteDish = asyncHandler(async (req: Request, res: Response) => {
  const { params } = dishIdSchema.parse({ params: req.params });
  await DishService.deleteDish(params.id);
  sendSuccess(res, 'Dish deleted successfully');
});
