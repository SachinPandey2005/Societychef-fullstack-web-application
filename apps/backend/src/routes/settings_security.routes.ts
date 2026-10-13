import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getSettings,
  updateSettings,
  getDevices,
  logoutDevice,
  getComplianceDocs,
  deleteAccountRequest,
  exportAccountRequest,
  synchronizeQueue,
} from '../controllers/settings_security.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

// Mounted at '/' (root) in routes/index.ts — see wallet_finance.routes.ts for
// why blanket `router.use(...)` calls here are wrong, for requireAuth just as
// much as partnerOnly (requireAuth alone 401s any unauthenticated request to
// a later, genuinely public route like GET /party/kitchens). Both scoped
// per-route instead, matching navigation_tracking.routes.ts's pattern. Also
// note: this file's own '/settings' route collides with the unrelated
// '/settings' prefix router (settings.routes.ts, mounted later) — this one
// wins since it's registered first; left as-is since fixing that ordering is
// a separate, larger concern than this auth-scoping fix.

// Settings
router.get('/settings', requireAuth, partnerOnly, getSettings);
router.put('/settings', requireAuth, partnerOnly, updateSettings);

// Session Devices History
router.get('/devices', requireAuth, partnerOnly, getDevices);
router.post('/devices/logout', requireAuth, partnerOnly, logoutDevice);

// Compliance policies
router.get('/compliance', requireAuth, partnerOnly, getComplianceDocs);
router.post('/account/delete-request', requireAuth, partnerOnly, deleteAccountRequest);
router.post('/account/export-request', requireAuth, partnerOnly, exportAccountRequest);

// Offline Queue Syncer
router.post('/sync', requireAuth, partnerOnly, synchronizeQueue);

export default router;
