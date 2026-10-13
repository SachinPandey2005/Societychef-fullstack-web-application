import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { RewardService } from '../services/reward.service';
import { sendSuccess } from '../utils/response';
import { createReferralSchema } from '../validators/reward.schema';

export const getMyRewards = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const balance = await RewardService.getBalance(profile_id);
  sendSuccess(res, 'Rewards retrieved', balance);
});

export const createReferral = asyncHandler(async (req: Request, res: Response) => {
  const referrer_id = req.user!.id;
  const { body } = createReferralSchema.parse({ body: req.body });
  const referral = await RewardService.createReferral(referrer_id, body.referred_id);
  sendSuccess(res, 'Referral created', referral, 201);
});
