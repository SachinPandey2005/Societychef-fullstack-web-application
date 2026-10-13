import { Router } from 'express';
import { PlatformController } from '../controllers/platform.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// Strict RBAC for Marketplace Operating System (MOS)
router.use(requireAuth);
// Allow SUPER_ADMIN exclusively
router.use(requireRole(['SUPER_ADMIN']));

router.post('/tenants', PlatformController.registerTenant);
router.get('/status', PlatformController.getTenantStatus);

export default router;
