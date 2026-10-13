import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getAnalyticsOverview,
  getTopChefs,
  getTopKitchens,
  getRevenueAnalytics,
  getPaymentAnalytics,
  getSettlementAnalytics,
  getRefundAnalytics,
} from '../controllers/analytics.controller';
import {
  getOrdersReport,
  getRevenueReport,
  getRefundReport,
  getChefDailyReport,
  getChefWeeklyReport,
  getChefMonthlyReport,
  getChefEarningsOverview,
  getChefOrders,
  getExecutiveFinanceSummary,
  getSocietyPerformanceReport,
} from '../controllers/reports.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']));

// Analytics Endpoints
router.get('/overview', getAnalyticsOverview);
router.get('/revenue', getRevenueAnalytics);
router.get('/payments', getPaymentAnalytics);
router.get('/settlements', getSettlementAnalytics);
router.get('/refunds', getRefundAnalytics);
router.get('/top-chefs', getTopChefs);
router.get('/top-kitchens', getTopKitchens);

// Reports Endpoints
router.get('/reports/finance-summary', getExecutiveFinanceSummary);
router.get('/reports/society-performance', getSocietyPerformanceReport);
router.get('/reports/orders', getOrdersReport);
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/refunds', getRefundReport);
router.get('/reports/chef/daily', getChefDailyReport);
router.get('/reports/chef/weekly', getChefWeeklyReport);
router.get('/reports/chef/monthly', getChefMonthlyReport);

// Chef Earnings & Orders Breakdown
router.get('/chefs/:id/earnings', getChefEarningsOverview);
router.get('/chefs/:id/orders', getChefOrders);


export default router;
