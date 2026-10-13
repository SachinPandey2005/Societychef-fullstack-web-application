import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { getSettings, updateSetting } from '../controllers/settings.controller';

const router = Router();

router.use(requireAuth);
// Only SUPER_ADMIN and PLATFORM_ADMIN can manage global settings
router.use(requireRole(['SUPER_ADMIN', 'admin']));

router.route('/')
  .get(getSettings);

router.route('/:key')
  .put(updateSetting);

export default router;
