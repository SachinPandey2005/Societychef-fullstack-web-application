import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { MarketingService } from '../services/marketing.service';
import { sendSuccess } from '../utils/response';
import { updatePreferencesSchema, createCampaignSchema, updateCampaignStatusSchema } from '../validators/marketing.schema';

// Consumer Actions
export const getMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const prefs = await MarketingService.getPreferences(profile_id);
  sendSuccess(res, 'Preferences retrieved', prefs);
});

export const updateMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = updatePreferencesSchema.parse({ body: req.body });
  const prefs = await MarketingService.updatePreferences(profile_id, body);
  sendSuccess(res, 'Preferences updated', prefs);
});

// Operations Actions
export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createCampaignSchema.parse({ body: req.body });
  const campaign = await MarketingService.createCampaign(body.name, body.channel, body.content_template, body.description, body.target_segment, body.scheduled_at);
  sendSuccess(res, 'Campaign created', campaign, 201);
});

export const getCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await MarketingService.getCampaigns();
  sendSuccess(res, 'Campaigns retrieved', campaigns);
});

export const executeCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign_id = req.params.id as string;
  const campaign = await MarketingService.executeCampaign(campaign_id);
  sendSuccess(res, 'Campaign execution started', campaign);
});

export const getCampaignAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const campaign_id = req.params.id as string;
  const stats = await MarketingService.getCampaignAnalytics(campaign_id);
  sendSuccess(res, 'Campaign analytics retrieved', stats);
});
