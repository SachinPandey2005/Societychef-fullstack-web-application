import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { createCampaign, getActiveCampaigns, updateCampaignStatus } from '../controllers/campaign.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'MARKETING_MANAGER', 'admin']));

router.route('/')
  .get(getActiveCampaigns)
  .post(createCampaign);

router.route('/:id/status')
  .patch(updateCampaignStatus);

export default router;
