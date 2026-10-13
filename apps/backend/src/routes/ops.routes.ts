import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { OpsController } from '../controllers/ops.controller';
import { RegionalOpsController } from '../controllers/regional_ops.controller';
import { getDashboardOverview } from '../controllers/dashboard.controller';

const router = Router();

router.use(requireAuth);

// General Ops Dashboard
router.get('/dashboard', requireRole(['SUPER_ADMIN', 'OPERATIONS']), getDashboardOverview);

// Operational metrics
router.get('/business/metrics', OpsController.businessMetrics);
router.get('/health', OpsController.systemHealth);

// Observability Dashboards (Phase 22)
router.get('/observability/metrics', OpsController.getMetrics);
router.get('/observability/incidents', OpsController.getIncidents);
router.post('/observability/trigger-alert', OpsController.triggerAlert);

// Regional Operations Dashboards (Phase 23)
router.get('/regional/dashboard', requireAuth, requireRole(['SUPER_ADMIN', 'OPERATIONS']), RegionalOpsController.getZoneDashboard);
router.get('/regional/dashboard/:zoneId', requireAuth, requireRole(['SUPER_ADMIN', 'OPERATIONS']), RegionalOpsController.getZoneDashboard);

export default router;
