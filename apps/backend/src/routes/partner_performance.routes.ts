import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getPartnerPerformance,
  getPartnerRatingsSummary,
  getPartnerReviews,
  getPartnerAchievements,
  getPartnerTargets,
  getPartnerIncentives,
  getPartnerLeaderboard,
  getPartnerRewards,
  redeemPartnerReward,
  getLearningCenterModules,
} from '../controllers/partner_performance.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

router.use(requireAuth);
router.use(partnerOnly);

router.get('/performance', getPartnerPerformance);
router.get('/ratings', getPartnerRatingsSummary);
router.get('/reviews', getPartnerReviews);
router.get('/achievements', getPartnerAchievements);
router.get('/targets', getPartnerTargets);
router.get('/incentives', getPartnerIncentives);
router.get('/leaderboard', getPartnerLeaderboard);
router.get('/rewards', getPartnerRewards);
router.post('/rewards/redeem', redeemPartnerReward);
router.get('/learning', getLearningCenterModules);

export default router;
