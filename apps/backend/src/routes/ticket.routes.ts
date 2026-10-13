import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getMyTickets, createMyTicket, getMyTicketMessages, addMyTicketMessage } from '../controllers/ticket.controller';

// Self-service support tickets for any authenticated consumer/chef — distinct
// from the admin-facing queue at /crm/tickets (requireRole-gated) and from
// the delivery-partner-only tickets at /support/tickets (requireRole-gated).
// A ticket's owner is always the authenticated user, never a client-supplied
// id (see TicketService.createMyTicket/getMessages/addMyMessage).
const router = Router();

router.use(requireAuth);

router.route('/')
  .get(getMyTickets)
  .post(createMyTicket);

router.route('/:id/messages')
  .get(getMyTicketMessages)
  .post(addMyTicketMessage);

export default router;
