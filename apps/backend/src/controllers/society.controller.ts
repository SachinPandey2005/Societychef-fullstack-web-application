import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { SocietyService } from '../services/society.service';
import { sendSuccess } from '../utils/response';
import { createSocietySchema, updateSocietySchema, societyIdSchema } from '../validators/society.schema';

export const getSocieties = asyncHandler(async (req: Request, res: Response) => {
  const societies = await SocietyService.getAllSocieties();
  sendSuccess(res, 'Societies retrieved successfully', societies);
});

export const getSociety = asyncHandler(async (req: Request, res: Response) => {
  const { params } = societyIdSchema.parse({ params: req.params });
  const society = await SocietyService.getSocietyById(params.id);
  sendSuccess(res, 'Society retrieved successfully', society);
});

export const createSociety = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createSocietySchema.parse({ body: req.body });
  const society = await SocietyService.createSociety(body);
  sendSuccess(res, 'Society created successfully', society, 201);
});

export const updateSociety = asyncHandler(async (req: Request, res: Response) => {
  const { params } = societyIdSchema.parse({ params: req.params });
  const { body } = updateSocietySchema.parse({ body: req.body });
  const society = await SocietyService.updateSociety(params.id, body);
  sendSuccess(res, 'Society updated successfully', society);
});

export const deleteSociety = asyncHandler(async (req: Request, res: Response) => {
  const { params } = societyIdSchema.parse({ params: req.params });
  await SocietyService.deleteSociety(params.id);
  sendSuccess(res, 'Society deleted successfully');
});
