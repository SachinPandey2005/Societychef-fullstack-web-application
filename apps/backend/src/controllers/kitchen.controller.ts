import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { KitchenService } from '../services/kitchen.service';
import { StorageService } from '../services/storage.service';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { clearCachedToken } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { createKitchenSchema, updateKitchenSchema, kitchenIdSchema } from '../validators/kitchen.schema';
import { z } from 'zod';

export const getKitchens = asyncHandler(async (req: Request, res: Response) => {
  const kitchens = await KitchenService.getAllKitchens();
  sendSuccess(res, 'Kitchens retrieved successfully', kitchens);
});

/**
 * Real rating/review-count/completed-order-count per kitchen, replacing the
 * hardcoded 4.9/4.7 rating and `orders: 25` every kitchen card showed in the
 * mobile app (apps/mobile/services/supabase/index.ts#mapDbKitchen) — public,
 * no auth needed, since this is exactly what the discover feed already
 * displays to anyone.
 */
export const getKitchenStats = asyncHandler(async (req: Request, res: Response) => {
  const idsParam = req.query.ids as string | undefined;
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : undefined;
  const stats = await KitchenRepository.getStatsMap(ids);
  sendSuccess(res, 'Kitchen stats retrieved', stats);
});

export const getKitchen = asyncHandler(async (req: Request, res: Response) => {
  const { params } = kitchenIdSchema.parse({ params: req.params });
  const kitchen = await KitchenService.getKitchenById(params.id);
  sendSuccess(res, 'Kitchen retrieved successfully', kitchen);
});

/** The authenticated chef's own kitchen, if they have one. */
export const getMyKitchen = asyncHandler(async (req: Request, res: Response) => {
  const kitchen = await KitchenRepository.findByChefUserId(req.user!.id);
  sendSuccess(res, kitchen ? 'Kitchen retrieved successfully' : 'No kitchen found', kitchen);
});

export const createKitchen = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createKitchenSchema.parse({ body: req.body });

  // A chef could otherwise set chef_user_id to an arbitrary UUID in the
  // request body and create a kitchen "owned" by someone else. Only admins
  // may create a kitchen on another user's behalf; chefs always own the
  // kitchen they're creating.
  if (req.user!.role !== 'admin') {
    body.chef_user_id = req.user!.id;
  }

  const kitchen = await KitchenService.createKitchen(body);

  // This endpoint doubles as self-service "become a chef" registration (see
  // kitchen.routes.ts — no role gate), so the owning profile needs an actual
  // role upgrade here, not just a kitchen row: every chef-only endpoint
  // (dish CRUD, PUT /kitchens/:id, supply orders, ...) gates on
  // requireRole(['chef', 'admin']), which reads the raw profiles.role column,
  // not a dynamically-resolved role. Skip admins/already-chefs so this never
  // downgrades anyone.
  const owner = await ProfileRepository.findById(body.chef_user_id);
  if (owner && owner.role !== 'admin' && owner.role !== 'chef') {
    await ProfileRepository.update(body.chef_user_id, {
      role: 'chef',
      roles: Array.from(new Set([...(owner.roles || ['consumer']), 'chef'])),
      active_role: 'chef',
    });
    // Invalidate requireAuth's per-token cache (see auth.middleware.ts) so
    // the caller's very next request sees the new role immediately instead
    // of the pre-upgrade one for up to 5 minutes.
    const token = req.headers.authorization?.split(' ')[1];
    if (token) clearCachedToken(token);
  }

  sendSuccess(res, 'Kitchen created successfully', kitchen, 201);
});

export const updateKitchen = asyncHandler(async (req: Request, res: Response) => {
  const { params } = kitchenIdSchema.parse({ params: req.params });
  const { body } = updateKitchenSchema.parse({ body: req.body });
  const kitchen = await KitchenService.updateKitchen(params.id, body);
  sendSuccess(res, 'Kitchen updated successfully', kitchen);
});

export const updateKitchenStatus = asyncHandler(async (req: Request, res: Response) => {
  const { params } = kitchenIdSchema.parse({ params: req.params });
  const { is_live } = z.object({ is_live: z.boolean() }).parse(req.body);
  
  const kitchen = await KitchenService.updateKitchenStatus(params.id, is_live);
  sendSuccess(res, 'Kitchen status updated successfully', kitchen);
});

export const deleteKitchen = asyncHandler(async (req: Request, res: Response) => {
  const { params } = kitchenIdSchema.parse({ params: req.params });
  await KitchenService.deleteKitchen(params.id);
  sendSuccess(res, 'Kitchen deleted successfully');
});

export const uploadChefDocument = asyncHandler(async (req: Request, res: Response) => {
  const { params } = kitchenIdSchema.parse({ params: req.params });
  
  if (!req.file) {
    return sendError(res, 'No document file provided');
  }

  // Upload to Private bucket chef-documents
  const url = await StorageService.uploadFile(
    'chef-documents',
    params.id,
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname
  );

  sendSuccess(res, 'Document uploaded successfully', { url });
});
