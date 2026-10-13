import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { 
  getMyPreferences, 
  updateMyPreferences, 
  createCampaign, 
  getCampaigns, 
  executeCampaign, 
  getCampaignAnalytics 
} from '../controllers/marketing.controller';

const router = Router();

router.use(requireAuth);

// Consumer explicit endpoints
router.get('/preferences', getMyPreferences);
router.patch('/preferences', updateMyPreferences);

// Operations/Admin marketing engine
router.use('/campaigns', requireRole(['admin', 'SUPER_ADMIN', 'OPERATIONS']));
router.post('/campaigns', createCampaign);
router.get('/campaigns', getCampaigns);
router.post('/campaigns/:id/execute', executeCampaign);
router.get('/campaigns/:id/analytics', getCampaignAnalytics);

export default router;
