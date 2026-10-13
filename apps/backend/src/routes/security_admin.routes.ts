import { Router } from 'express';
import { SecurityAdminController } from '../controllers/security_admin.controller';
import { requireAuth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Only ops and admins can access the security dashboard
router.use(requireAuth, authorize(['admin', 'ops']));

router.get('/sessions', SecurityAdminController.getActiveSessions);
router.get('/compliance-requests', SecurityAdminController.getComplianceRequests);
router.post('/audit-report', SecurityAdminController.triggerAuditReport);

export default router;
