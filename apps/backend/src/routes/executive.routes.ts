import { Router } from 'express';
import { ExecutiveController } from '../controllers/executive.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// Strict RBAC for Executive Dashboard
router.use(requireAuth);
// In a real system we'd have an EXECUTIVE role, but SUPER_ADMIN covers it here
router.use(requireRole(['SUPER_ADMIN']));

router.get('/dashboard', ExecutiveController.getMasterDashboard);

export default router;
