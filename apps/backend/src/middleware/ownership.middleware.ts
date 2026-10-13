import { Request, Response, NextFunction } from 'express';
import { AuthorizationError, NotFoundError } from '../utils/errors';
import { KitchenService } from '../services/kitchen.service';
import { DishService } from '../services/dish.service';
import { OrderService } from '../services/order.service';
import { WeeklyDishRepository } from '../repositories/weeklyDish.repository';

export const requireKitchenOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kitchenId = req.params.id as string;
    const user = req.user!; // Guarantee from requireAuth

    // Admins bypass ownership checks
    if (user.role === 'admin') return next();

    const kitchen = await KitchenService.getKitchenById(kitchenId);
    if (kitchen.chef_user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to manage this kitchen');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireDishOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dishId = req.params.id as string;
    const user = req.user!;

    if (user.role === 'admin') return next();

    const dish = await DishService.getDishById(dishId);
    
    // Find the kitchen the dish belongs to
    const kitchen = await KitchenService.getKitchenById(dish.kitchen_id);
    
    if (kitchen.chef_user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to manage this dish');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireWeeklyDishOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weeklyDishId = req.params.id as string;
    const user = req.user!;

    if (user.role === 'admin') return next();

    const weeklyDish = await WeeklyDishRepository.findById(weeklyDishId);
    if (!weeklyDish) throw new NotFoundError('Weekly dish not found');

    const kitchen = await KitchenService.getKitchenById(weeklyDish.kitchen_id);
    if (kitchen.chef_user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to manage this weekly dish');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireOrderOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id as string;
    const user = req.user!;

    if (user.role === 'admin') return next();

    const order = await OrderService.getOrderById(orderId);

    // orders.customer_id/consumer_id/profile_id are three overlapping columns
    // left over from schema drift — different write paths populate different
    // ones (apps/mobile/services/supabase/index.ts#placeOrder only ever sets
    // customer_id). Checking profile_id alone meant a real customer calling
    // this on their own order could be wrongly rejected as unauthorized.
    if (order.customer_id === user.id || order.consumer_id === user.id || order.profile_id === user.id) {
      return next(); // Consumer of the order
    }

    // Check if user is the chef for the kitchen of this order
    const kitchen = await KitchenService.getKitchenById(order.kitchen_id);
    if (kitchen.chef_user_id === user.id) {
      return next(); // Chef of the kitchen
    }

    throw new AuthorizationError('You do not have permission to access this order');
  } catch (error) {
    next(error);
  }
};
