import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { CampaignService } from '../services/campaign.service';
import { sendSuccess } from '../utils/response';
import { createCampaignSchema, updateCampaignStatusSchema } from '../validators/campaign.schema';

export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createCampaignSchema.parse({ body: req.body });
  const campaign = await CampaignService.createCampaign(
    body.name, body.type, body.target_audience, body.content, body.start_date, body.end_date, body.target_id
  );
  sendSuccess(res, 'Campaign created', campaign, 201);
});

export const getActiveCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await CampaignService.getActiveCampaigns();
  sendSuccess(res, 'Active campaigns retrieved', campaigns);
});

export const updateCampaignStatus = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateCampaignStatusSchema.parse({ params: req.params, body: req.body });
  const campaign = await CampaignService.updateStatus(params.id, body.is_active);
  sendSuccess(res, 'Campaign status updated', campaign);
});
