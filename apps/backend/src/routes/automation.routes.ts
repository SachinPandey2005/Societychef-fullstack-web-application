import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  runReconciliation,
  getReconciliationSummary,
  getBackgroundJobsStatus,
  runBackgroundJob,
  updateFinanceSettings,
  getLedgerEntries,
  archiveSettlements,
} from '../controllers/automation.controller';

const router = Router();

router.use(requireAuth);

// Read endpoints: Open to Super Admin, Admin, Finance, Operations
router.get('/reconciliation', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getReconciliationSummary);
router.get('/background-jobs/status', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getBackgroundJobsStatus);
router.get('/ledger', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), getLedgerEntries);

// Mutation endpoints: Restricted to Super Admin and Finance
router.post('/reconciliation', requireRole(['SUPER_ADMIN', 'FINANCE']), runReconciliation);
router.post('/background-jobs/run', requireRole(['SUPER_ADMIN', 'FINANCE']), runBackgroundJob);
router.patch('/settings', requireRole(['SUPER_ADMIN', 'FINANCE']), updateFinanceSettings);
router.post('/archive', requireRole(['SUPER_ADMIN', 'FINANCE']), archiveSettlements);

export default router;
