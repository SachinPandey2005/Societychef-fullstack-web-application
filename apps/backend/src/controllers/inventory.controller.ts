import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { InventoryService } from '../services/inventory.service';
import { sendSuccess } from '../utils/response';
import { createIngredientSchema, addRecipeIngredientSchema, adjustStockSchema, logWastageSchema } from '../validators/inventory.schema';

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const kitchen_id = req.query.kitchen_id as string;
  if (!kitchen_id) throw new Error('kitchen_id query param required');
  const inventory = await InventoryService.getInventory(kitchen_id);
  sendSuccess(res, 'Inventory retrieved', inventory);
});

export const addIngredient = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createIngredientSchema.parse({ body: req.body });
  const ingredient = await InventoryService.createIngredient(body.kitchen_id, body.name, body.category, body.unit, body.cost_per_unit, body.shelf_life_days, body.min_stock_level);
  sendSuccess(res, 'Ingredient created', ingredient, 201);
});

export const mapRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { body } = addRecipeIngredientSchema.parse({ body: req.body });
  const recipe = await InventoryService.addRecipeIngredient(body.dish_id, body.ingredient_id, body.quantity_required);
  sendSuccess(res, 'Recipe updated', recipe, 201);
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { body } = adjustStockSchema.parse({ body: req.body });
  const stock = await InventoryService.adjustStock(body.ingredient_id, body.type, body.amount, body.reason);
  sendSuccess(res, 'Stock adjusted', stock);
});

export const logWastage = asyncHandler(async (req: Request, res: Response) => {
  const { body } = logWastageSchema.parse({ body: req.body });
  const stock = await InventoryService.logWastage(body.ingredient_id, body.quantity_lost, body.reason);
  sendSuccess(res, 'Wastage logged', stock);
});
