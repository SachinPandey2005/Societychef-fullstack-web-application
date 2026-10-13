import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AddonRepository } from '../repositories/addon.repository';
import { sendSuccess } from '../utils/response';
import { dishAddonParamsSchema, addonIdParamsSchema, createAddonSchema, updateAddonSchema } from '../validators/addon.schema';
import { NotFoundError } from '../utils/errors';

export const getDishAddons = asyncHandler(async (req: Request, res: Response) => {
  const { params } = dishAddonParamsSchema.parse({ params: req.params });
  const addons = await AddonRepository.findByDishId(params.id);
  sendSuccess(res, 'Add-ons retrieved successfully', addons);
});

export const createDishAddon = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = createAddonSchema.parse({ params: req.params, body: req.body });
  const addon = await AddonRepository.create({ dish_id: params.id, ...body });
  sendSuccess(res, 'Add-on created successfully', addon, 201);
});

export const updateDishAddon = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateAddonSchema.parse({ params: req.params, body: req.body });
  const existing = await AddonRepository.findById(params.addonId);
  if (!existing || existing.dish_id !== params.id) {
    throw new NotFoundError('Add-on not found');
  }
  const updated = await AddonRepository.update(params.addonId, body);
  sendSuccess(res, 'Add-on updated successfully', updated);
});

export const deleteDishAddon = asyncHandler(async (req: Request, res: Response) => {
  const { params } = addonIdParamsSchema.parse({ params: req.params });
  const existing = await AddonRepository.findById(params.addonId);
  if (!existing || existing.dish_id !== params.id) {
    throw new NotFoundError('Add-on not found');
  }
  await AddonRepository.delete(params.addonId);
  sendSuccess(res, 'Add-on deleted successfully', {});
});
