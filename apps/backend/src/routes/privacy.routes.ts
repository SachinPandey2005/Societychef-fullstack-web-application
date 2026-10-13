import { Router } from 'express';
import { PrivacyController } from '../controllers/privacy.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Consumers can access their own privacy settings
router.use(requireAuth);

router.post('/export', PrivacyController.exportData);
router.post('/delete', PrivacyController.requestDeletion);

export default router;
