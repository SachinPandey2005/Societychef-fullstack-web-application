import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getDashboardOverview,
  getFinanceSummary,
  getRevenueAnalytics,
  getOrdersSummary,
  getPaymentSummary,
  getSettlementsSummary,
  getTopChefs,
  getTopSocieties,
  getRecentFinancialActivity,
  getPerformanceMetrics,
} from '../controllers/dashboard.controller';

const router = Router();

// Protect ALL dashboard routes with Auth & Role restrictions
router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']));

router.get('/overview', getDashboardOverview);
router.get('/finance-summary', getFinanceSummary);
router.get('/revenue', getRevenueAnalytics);
router.get('/orders-summary', getOrdersSummary);
router.get('/payment-summary', getPaymentSummary);
router.get('/settlements-summary', getSettlementsSummary);
router.get('/top-chefs', getTopChefs);
router.get('/top-societies', getTopSocieties);
router.get('/recent-financial-activity', getRecentFinancialActivity);
router.get('/performance-metrics', getPerformanceMetrics);

export default router;
