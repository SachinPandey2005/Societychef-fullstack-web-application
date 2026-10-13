import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getTickets,
  createTicket,
  getTicketDetails,
  sendChatMessage,
  reportIncident,
  triggerEmergencySOS,
  getFaqs,
  submitFeedback,
} from '../controllers/support.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

// Mounted at '/' (root) in routes/index.ts — see wallet_finance.routes.ts for
// why blanket `router.use(...)` calls here are wrong, for requireAuth just as
// much as partnerOnly (requireAuth alone 401s any unauthenticated request to
// a later, genuinely public route like GET /party/kitchens). Both scoped
// per-route instead, matching navigation_tracking.routes.ts's pattern.

// Tickets & Realtime Chat Support
router.get('/support/tickets', requireAuth, partnerOnly, getTickets);
router.post('/support/tickets', requireAuth, partnerOnly, createTicket);
router.get('/support/tickets/:id', requireAuth, partnerOnly, getTicketDetails);
router.post('/support/chat', requireAuth, partnerOnly, sendChatMessage);

// Incidents & SOS Panic Alarms
router.post('/incident', requireAuth, partnerOnly, reportIncident);
router.post('/emergency', requireAuth, partnerOnly, triggerEmergencySOS);

// FAQs & Feedbacks
router.get('/faq', requireAuth, partnerOnly, getFaqs);
router.post('/partner/feedback', requireAuth, partnerOnly, submitFeedback);

export default router;
