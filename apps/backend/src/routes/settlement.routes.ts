import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getSettlements,
  getSettlementSummary,
  getSettlementDetails,
  generateSettlement,
  bulkGenerateSettlements,
  updateSettlementStatus,
  bulkUpdateSettlementStatus,
  getPendingSettlements,
  exportSettlements,
  payChefHandler,
  retryChefPayoutHandler,
  getPayoutHistoryHandler,
  manualPaymentHandler,
  reverseSettlement,
} from '../controllers/settlement.controller';

const router = Router();

router.use(requireAuth);

// Read Endpoints: Open to Super Admin, Admin, Finance, Operations
router.get('/', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getSettlements);
router.get('/summary', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getSettlementSummary);
router.get('/pending', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getPendingSettlements);
router.get('/export', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), exportSettlements);
router.get('/:id', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getSettlementDetails);
router.get('/:id/payment-history', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getPayoutHistoryHandler);

// Generation & Payout Execution: Restricted strictly to Super Admin and Finance
router.post('/generate', requireRole(['SUPER_ADMIN', 'FINANCE']), generateSettlement);
router.post('/bulk-generate', requireRole(['SUPER_ADMIN', 'FINANCE']), bulkGenerateSettlements);
router.patch('/:id/status', requireRole(['SUPER_ADMIN', 'FINANCE']), updateSettlementStatus);
router.post('/bulk-status', requireRole(['SUPER_ADMIN', 'FINANCE']), bulkUpdateSettlementStatus);

// Reversal & Payout Execution Endpoints: Restricted strictly to Super Admin and Finance
router.post('/:id/pay', requireRole(['SUPER_ADMIN', 'FINANCE']), payChefHandler);
router.post('/:id/retry-payment', requireRole(['SUPER_ADMIN', 'FINANCE']), retryChefPayoutHandler);
router.patch('/:id/manual-payment', requireRole(['SUPER_ADMIN', 'FINANCE']), manualPaymentHandler);
router.post('/:id/reverse', requireRole(['SUPER_ADMIN', 'FINANCE']), reverseSettlement);

export default router;

