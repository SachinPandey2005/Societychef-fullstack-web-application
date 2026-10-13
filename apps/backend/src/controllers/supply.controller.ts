import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';
import { SupplyRepository } from '../repositories/supply.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { createSupplyOrderSchema } from '../validators/supply.schema';

export const getSupplyItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await SupplyRepository.getItems();
  sendSuccess(res, 'Supply items retrieved', items);
});

/**
 * Previously app/(chef)/supplies.tsx's checkout just waited 500ms and showed
 * a success alert — nothing was ever persisted. Prices are resolved
 * server-side from supply_items, never trusted from the client.
 */
export const createSupplyOrder = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createSupplyOrderSchema.parse({ body: req.body });

  const kitchen = await KitchenRepository.findByChefUserId(req.user!.id);
  if (!kitchen) throw new NotFoundError('No kitchen found for this chef.');

  let totalAmount = 0;
  const resolvedItems: { supply_item_id: string; item_name_snapshot: string; price_snapshot: number; quantity: number }[] = [];

  for (const line of body.items) {
    const item = await SupplyRepository.getItemById(line.supply_item_id);
    if (!item) throw new ValidationError(`Supply item ${line.supply_item_id} not found.`);
    totalAmount += item.price * line.quantity;
    resolvedItems.push({
      supply_item_id: item.id,
      item_name_snapshot: item.name,
      price_snapshot: item.price,
      quantity: line.quantity,
    });
  }

  const order = await SupplyRepository.createOrder(kitchen.id, totalAmount);
  await SupplyRepository.createOrderItems(resolvedItems.map((item) => ({ ...item, supply_order_id: order.id })));

  sendSuccess(res, 'Supply order placed successfully', { ...order, items: resolvedItems }, 201);
});

export const getMySupplyOrders = asyncHandler(async (req: Request, res: Response) => {
  const kitchen = await KitchenRepository.findByChefUserId(req.user!.id);
  if (!kitchen) return sendSuccess(res, 'Supply orders retrieved', []);
  const orders = await SupplyRepository.getOrdersForKitchen(kitchen.id);
  sendSuccess(res, 'Supply orders retrieved', orders);
});
