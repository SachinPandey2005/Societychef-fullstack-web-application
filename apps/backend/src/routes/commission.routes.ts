import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  calculateCommission,
} from '../controllers/commission.controller';

const router = Router();

router.use(requireAuth);

router.post('/calculate', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), calculateCommission);
router.get('/rules', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getCommissionRules);

// Commission Rules Mutation: Restricted strictly to Super Admin and Finance
router.post('/rules', requireRole(['SUPER_ADMIN', 'FINANCE']), createCommissionRule);
router.put('/rules/:id', requireRole(['SUPER_ADMIN', 'FINANCE']), updateCommissionRule);
router.delete('/rules/:id', requireRole(['SUPER_ADMIN', 'FINANCE']), deleteCommissionRule);

export default router;
