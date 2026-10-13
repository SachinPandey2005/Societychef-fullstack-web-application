import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getRefunds,
  getRefundById,
  requestRefund,
  approveRefund,
  processRefund,
  getFinancialAdjustments,
  createFinancialAdjustment,
  getDisputes,
  getDisputeById,
  createDispute,
  updateDisputeStatus,
  addDisputeComment,
} from '../controllers/refund.controller';

const router = Router();

router.use(requireAuth);

// --- Refunds ---
router.get('/', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getRefunds);
router.get('/adjustments', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getFinancialAdjustments);
router.post('/adjustments', requireRole(['SUPER_ADMIN', 'FINANCE']), createFinancialAdjustment);

router.get('/disputes', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS', 'SUPPORT_AGENT']), getDisputes);
router.post('/disputes', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS', 'SUPPORT_AGENT']), createDispute);
router.get('/disputes/:id', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS', 'SUPPORT_AGENT']), getDisputeById);
router.patch('/disputes/:id', requireRole(['SUPER_ADMIN', 'FINANCE', 'OPERATIONS']), updateDisputeStatus);
router.post('/disputes/:id/comments', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS', 'SUPPORT_AGENT']), addDisputeComment);

router.get('/:id', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getRefundById);
router.post('/', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), requestRefund);
router.post('/approve', requireRole(['SUPER_ADMIN', 'FINANCE']), approveRefund);
router.post('/process', requireRole(['SUPER_ADMIN', 'FINANCE']), processRefund);

export default router;
