import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/export', requireAuth, ComplianceController.exportData);
router.post('/delete', requireAuth, ComplianceController.requestDeletion);

export default router;
