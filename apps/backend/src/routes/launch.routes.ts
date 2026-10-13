import { Router } from 'express';
import { LaunchController } from '../controllers/launch.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN']));

router.get('/certification', LaunchController.generateCertification);

export default router;
