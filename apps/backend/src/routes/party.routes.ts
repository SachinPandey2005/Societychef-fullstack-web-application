import { Router } from 'express';
import { getPartyMenu, savePartyMenu, getPartyKitchens, createMyPartyOrder, getPartyBookings, getPartyBookingById, updatePartyBookingStatus, addPartyPacks } from '../controllers/party.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { requireOrderOwnership } from '../middleware/ownership.middleware';

const router = Router();

// Public browsing — matches the party_menus RLS policy (anyone can read an
// enabled menu).
router.get('/kitchens', getPartyKitchens);
router.get('/menu/:kitchenId', getPartyMenu);
// Was previously unauthenticated entirely — any anonymous request could
// overwrite any kitchen's party menu. Ownership is checked inside the
// controller (kitchenId isn't the :id param requireKitchenOwnership expects).
router.put('/menu/:kitchenId', requireAuth, savePartyMenu);

// Self-service booking — any authenticated consumer. customer_id always
// comes from req.user, never the request body (see controller).
router.post('/orders', requireAuth, createMyPartyOrder);

// Bookings — platform-wide party-booking management, ops/admin only. Was
// previously unauthenticated: GET /bookings returned every party order on the
// platform (with customer names/phones/emails) to anyone, and
// updatePartyBookingStatus would have thrown on req.user!.id for any
// unauthenticated caller rather than a clean 401.
// requireRole now resolves 'OPERATIONS' against the real stored lowercase
// 'ops' value itself (see rbac.middleware.ts's ROLE_ALIASES) — no need for
// an `as any` workaround here anymore.
const opsOnly = requireRole(['OPERATIONS', 'admin', 'SUPER_ADMIN']);
router.get('/bookings', requireAuth, opsOnly, getPartyBookings);
router.get('/bookings/:id', requireAuth, opsOnly, getPartyBookingById);
router.patch('/bookings/:id/status', requireAuth, opsOnly, updatePartyBookingStatus);
// requireOrderOwnership uses req.params.id, so this must stay mounted at :id
router.patch('/bookings/:id/add-packs', requireAuth, requireOrderOwnership, addPartyPacks);

export default router;
