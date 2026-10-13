import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { OrderService } from '../services/order.service';
import { KitchenService } from '../services/kitchen.service';
import { sendSuccess } from '../utils/response';
import { checkoutSchema, orderStatusTransitionSchema, orderIdSchema, createDirectOrderSchema } from '../validators/order.schema';
import { z } from 'zod';

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = checkoutSchema.parse({ body: req.body });
  
  const order = await OrderService.createOrderFromCart(profile_id, body.delivery_mode);
  sendSuccess(res, 'Order placed successfully', order, 201);
});

export const createDirectOrder = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = createDirectOrderSchema.parse({ body: req.body });

  const order = await OrderService.createDirectOrder(profile_id, body);
  sendSuccess(res, 'Order placed successfully', order, 201);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { params } = orderIdSchema.parse({ params: req.params });
  const order = await OrderService.getOrderById(params.id);
  sendSuccess(res, 'Order retrieved successfully', order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = orderStatusTransitionSchema.parse({ params: req.params, body: req.body });
  const actor_role = req.user!.role; // Passed to service for generic logic validation
  
  const order = await OrderService.updateOrderStatus(params.id, body.status, actor_role);
  sendSuccess(res, `Order status updated to ${body.status}`, order);
});

export const getOrderHistory = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  
  // If chef, they might want kitchen history. But a chef can also be a consumer.
  // For this simple impl, if you hit /history, we return consumer history.
  // If they pass ?kitchen_id=..., we could return kitchen history.
  const query = z.object({ kitchen_id: z.string().uuid().optional() }).parse(req.query);

  if (query.kitchen_id) {
    // Validate they own the kitchen
    const kitchen = await KitchenService.getKitchenById(query.kitchen_id);
    if (kitchen.chef_user_id !== profile_id && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this kitchen history' });
    }
    const history = await OrderService.getKitchenHistory(query.kitchen_id);
    return sendSuccess(res, 'Kitchen order history retrieved', history);
  }

  const history = await OrderService.getConsumerHistory(profile_id);
  sendSuccess(res, 'Consumer order history retrieved', history);
});
