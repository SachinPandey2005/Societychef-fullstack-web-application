import { Router } from 'express';
import { GovernanceController } from '../controllers/governance.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// Strict RBAC for Enterprise Governance
router.use(requireAuth);
// Allow SUPER_ADMIN
router.use(requireRole(['SUPER_ADMIN']));

router.get('/dashboard', GovernanceController.getDashboard);
router.get('/dr/readiness', GovernanceController.getDrReadiness);
router.post('/dr/backup', GovernanceController.triggerBackup);

export default router;
