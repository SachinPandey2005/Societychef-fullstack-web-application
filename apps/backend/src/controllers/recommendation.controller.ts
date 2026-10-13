import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { RecommendationService } from '../services/recommendation.service';
import { sendSuccess } from '../utils/response';
import { submitFeedbackSchema, updatePreferencesSchema } from '../validators/recommendation.schema';
import { ValidationError } from '../utils/errors';

export const getPersonalizedFeed = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  // Assume society_id is sent via query or inferred from profile. 
  // For simplicity, we require it in query here.
  const society_id = req.query.society_id as string;
  if (!society_id) throw new ValidationError('society_id query param is required');

  const feed = await RecommendationService.getPersonalizedFeed(profile_id, society_id);
  sendSuccess(res, 'Personalized feed retrieved', feed);
});

export const getTrending = asyncHandler(async (req: Request, res: Response) => {
  const society_id = req.query.society_id as string;
  if (!society_id) throw new ValidationError('society_id query param is required');

  const trending = await RecommendationService.getTrendingInSociety(society_id);
  sendSuccess(res, 'Trending data retrieved', trending);
});

export const submitFeedback = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = submitFeedbackSchema.parse({ body: req.body });
  
  await RecommendationService.submitFeedback(profile_id, body.item_id, body.item_type, body.action);
  sendSuccess(res, 'Feedback submitted successfully');
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = updatePreferencesSchema.parse({ body: req.body });
  
  const updated = await RecommendationService.updatePreferences(profile_id, body.favorite_cuisines, body.dietary_preferences, body.price_preference);
  sendSuccess(res, 'Preferences updated', updated);
});
