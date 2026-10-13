import { Router } from 'express';
import { BIController } from '../controllers/bi.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// Stage 13: RBAC for BI operations
router.use(requireAuth);
// Allow operations and super admins
router.use(requireRole(['OPERATIONS', 'SUPER_ADMIN']));

router.get('/forecast', BIController.getForecast);
router.post('/simulate', BIController.simulateScenario);

export default router;
