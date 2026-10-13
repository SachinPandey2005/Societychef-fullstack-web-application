import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getMyWallet,
  topupWallet,
  getMyInvoices,
  getJournalEntries,
  requestPayout,
  updatePayoutStatus,
  getChefEarnings,
  getMySettlements,
  exportFinancialReport,
  getReconciliationReport,
} from '../controllers/finance.controller';

const router = Router();

router.use(requireAuth);

// Consumer & Chef Wallet / Invoice endpoints
router.get('/wallet', getMyWallet);
router.post('/wallet/topup', topupWallet);
router.get('/invoices', getMyInvoices);

// Chef Payout & Earnings endpoints
router.get('/chef/earnings', requireRole(['chef']), getChefEarnings);
router.get('/settlements', requireRole(['chef']), getMySettlements);
router.post('/payouts/request', requireRole(['chef']), requestPayout);

// Admin/Ops Endpoints
router.get('/accounting/journals', requireRole(['admin', 'SUPER_ADMIN', 'OPERATIONS']), getJournalEntries);
router.patch('/payouts/:id/status', requireRole(['admin', 'SUPER_ADMIN', 'OPERATIONS']), updatePayoutStatus);
// These two existed as controller functions but were never wired to a route —
// the mobile ops finance dashboard (app/(admin)/OpsFinanceDashboard.tsx) has
// been calling GET /finance/export and /finance/reconciliation since it was
// written, and both have always 404'd.
router.get('/export', requireRole(['admin', 'SUPER_ADMIN', 'OPERATIONS']), exportFinancialReport);
router.get('/reconciliation', requireRole(['admin', 'SUPER_ADMIN', 'OPERATIONS']), getReconciliationReport);

export default router;
