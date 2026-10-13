import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// Strict RBAC for Enterprise Command Center
router.use(requireAuth);
router.use(requireRole(['admin', 'SUPER_ADMIN']));

// Dashboards
router.get('/dashboards/executive', AdminController.getExecutiveDashboard);

// Platform Management
router.post('/flags/toggle', AdminController.toggleFeatureFlag);
router.post('/maintenance/toggle', AdminController.toggleMaintenanceMode);

export default router;
