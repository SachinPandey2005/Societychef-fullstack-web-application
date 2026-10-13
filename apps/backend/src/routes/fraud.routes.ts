import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { 
  createFraudRule, 
  resolveFraudCase 
} from '../controllers/fraud.controller';

const router = Router();

router.use(requireAuth);

// Admin Endpoints
router.post('/rules', requireRole(['admin', 'SUPER_ADMIN']), createFraudRule);

// Ops Endpoints
router.patch('/cases/:id', requireRole(['admin', 'SUPER_ADMIN', 'OPERATIONS']), resolveFraudCase);

export default router;
