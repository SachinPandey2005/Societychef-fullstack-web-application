import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { CartService } from '../services/cart.service';
import { sendSuccess } from '../utils/response';
import { addToCartSchema, updateCartItemSchema, cartItemIdSchema } from '../validators/cart.schema';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const cart = await CartService.getCart(profile_id);
  sendSuccess(res, 'Cart retrieved successfully', cart);
});

export const addDishToCart = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = addToCartSchema.parse({ body: req.body });
  
  const item = await CartService.addDishToCart(profile_id, body.dish_id, body.quantity);
  sendSuccess(res, 'Item added to cart', item, 201);
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { params, body } = updateCartItemSchema.parse({ params: req.params, body: req.body });
  
  const updated = await CartService.updateItemQuantity(profile_id, params.id, body.quantity);
  sendSuccess(res, 'Cart item updated', updated);
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { params } = cartItemIdSchema.parse({ params: req.params });
  
  await CartService.removeItem(profile_id, params.id);
  sendSuccess(res, 'Cart item removed successfully');
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  await CartService.clearCart(profile_id);
  sendSuccess(res, 'Cart cleared successfully');
});
