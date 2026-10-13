import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

import { getMyRewards, createReferral } from '../controllers/reward.controller';
import { createCoupon, validateCoupon } from '../controllers/coupon.controller';
import { createCampaign, getActiveCampaigns, updateCampaignStatus } from '../controllers/campaign.controller';
import { getAnalyticsOverview } from '../controllers/analytics.controller';
import { exportOrders } from '../controllers/report.controller';
import { generateSettlement, updateSettlementStatus, getKitchenSettlements, getPendingSettlements } from '../controllers/settlement.controller';
import { getFinanceOverview } from '../controllers/finance.controller';

const router = Router();

// ================= Consumer/Chef Facing Routes =================
router.use('/loyalty', requireAuth);
router.get('/loyalty/rewards', getMyRewards);
router.post('/loyalty/referrals', createReferral);

router.post('/coupons/validate', requireAuth, validateCoupon);

// ================= Internal Growth / Finance Routes =================
router.use('/internal', requireAuth);
router.use('/internal', requireRole(['OPERATIONS', 'FINANCE', 'SUPER_ADMIN', 'admin']));

// Coupons & Marketing
router.post('/internal/coupons', createCoupon);
router.post('/internal/campaigns', createCampaign);
router.get('/internal/campaigns', getActiveCampaigns);
router.patch('/internal/campaigns/:id/status', updateCampaignStatus);

// Analytics & Reports
router.get('/internal/analytics', getAnalyticsOverview);
router.get('/internal/reports/orders/export', exportOrders);

// Finance & Settlements
router.get('/internal/finance/overview', getFinanceOverview);
router.post('/internal/settlements', generateSettlement);
router.get('/internal/settlements/pending', getPendingSettlements);
router.patch('/internal/settlements/:id/status', updateSettlementStatus);
router.get('/internal/settlements/kitchen/:kitchenId', getKitchenSettlements);

export default router;
