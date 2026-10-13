import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getWalletSummary,
  getEarningsBreakdown,
  getOrderEarningDetail,
  getSettlementsList,
  getSettlementDetail,
  getTransactionFeed,
  getPayoutHistory,
  updateBankDetails,
  requestPayout,
} from '../controllers/wallet_finance.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

// This router is mounted at '/' (root) in routes/index.ts, alongside several
// other root-mounted routers, because its own paths (/wallet, /earnings,
// etc.) don't share a common prefix. Blanket `router.use(...)` calls here —
// originally both requireAuth AND partnerOnly — ran for EVERY request that
// reached this router — which, mounted at root, is every request not
// already matched by an earlier specific-prefix router — before Express
// ever got a chance to check whether the path matched a route in this file
// at all. requireAuth alone is enough to do this damage: it 401s any
// unauthenticated request, which breaks genuinely public routes registered
// afterward (e.g. GET /party/kitchens). Both are now scoped per-route,
// matching the pattern in navigation_tracking.routes.ts, so an unmatched
// path correctly falls through to the next router instead of being
// intercepted here.

// FinTech & Wallet Endpoints
router.get('/wallet', requireAuth, partnerOnly, getWalletSummary);
router.get('/earnings', requireAuth, partnerOnly, getEarningsBreakdown);
router.get('/earnings/:orderId', requireAuth, partnerOnly, getOrderEarningDetail);
router.get('/settlements', requireAuth, partnerOnly, getSettlementsList);
router.get('/settlements/:id', requireAuth, partnerOnly, getSettlementDetail);
router.get('/transactions', requireAuth, partnerOnly, getTransactionFeed);
router.get('/payouts', requireAuth, partnerOnly, getPayoutHistory);
router.put('/bank-details', requireAuth, partnerOnly, updateBankDetails);
router.post('/payout-request', requireAuth, partnerOnly, requestPayout);

export default router;
