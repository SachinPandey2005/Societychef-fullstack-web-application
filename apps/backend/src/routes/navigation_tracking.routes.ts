import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  updateLocation,
  calculateRoute,
  calculateEta,
  startTracking,
  stopTracking,
  getOrderTracking,
} from '../controllers/navigation_tracking.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

// Mounted at '/' (root) in routes/index.ts, alongside several other
// root-mounted routers whose own paths don't share a common prefix. A
// blanket `router.use(requireAuth)` here ran for every request that reached
// this router — which, mounted at root, is every request not already
// matched by an earlier specific-prefix router — rejecting any
// unauthenticated caller with a 401 before Express ever checked whether the
// path matched a route in this file at all. That silently broke genuinely
// public routes registered afterward in routes/index.ts, e.g.
// GET /party/kitchens and GET /party/menu/:kitchenId (see
// party.routes.ts's own comment — "anyone can read an enabled menu").
// Scoped per-route instead, same fix as wallet_finance/support/
// settings_security.routes.ts.
router.post('/location/update', requireAuth, partnerOnly, updateLocation);
router.get('/navigation/route', requireAuth, calculateRoute);
router.get('/navigation/eta', requireAuth, calculateEta);

// Tracking Sessions
router.post('/tracking/start', requireAuth, partnerOnly, startTracking);
router.post('/tracking/stop', requireAuth, partnerOnly, stopTracking);
router.get('/tracking/order/:id', requireAuth, getOrderTracking);

export default router;
