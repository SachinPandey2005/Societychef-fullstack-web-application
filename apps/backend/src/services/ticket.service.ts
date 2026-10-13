import { TicketRepository } from '../repositories/ticket.repository';
import { CrmService } from './crm.service';
import { TicketPriority, TicketStatus } from '../types/ticket';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export class TicketService {
  static async createTicket(customer_id: string, subject: string, description: string, priority: TicketPriority) {
    return TicketRepository.createTicket({ customer_id, subject, description, priority });
  }

  /**
   * Self-service ticket creation — customer_id always comes from the
   * authenticated session, never the request body, so one user can't open a
   * ticket under another user's identity.
   */
  static async createMyTicket(profileId: string, payload: { subject: string; description: string; priority?: TicketPriority; category?: string; order_id?: string }) {
    return TicketRepository.createTicket({
      customer_id: profileId,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority || 'MEDIUM',
      category: payload.category,
      order_id: payload.order_id,
    });
  }

  static async getMyTickets(profileId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    return TicketRepository.getTicketsForProfile(profileId, limit, offset);
  }

  /** Only the ticket's own owner can read its message thread. */
  static async getMessages(ticketId: string, requesterId: string) {
    const ticket = await TicketRepository.getTicketById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.customer_id !== requesterId) {
      throw new AuthorizationError('You do not have access to this ticket');
    }
    return TicketRepository.getMessages(ticketId);
  }

  /** Only the ticket's own owner can post into its message thread. */
  static async addMyMessage(ticketId: string, requesterId: string, message: string) {
    const ticket = await TicketRepository.getTicketById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.customer_id !== requesterId) {
      throw new AuthorizationError('You do not have access to this ticket');
    }
    return TicketRepository.addMessage({ sender_id: requesterId, ticket_id: ticketId, message });
  }

  static async updateStatus(admin_id: string, ticket_id: string, status: TicketStatus) {
    const ticket = await TicketRepository.updateStatus(ticket_id, status);
    if (!ticket) throw new NotFoundError('Ticket not found');

    await CrmService.logAction(admin_id, `TICKET_STATUS_${status}`, 'ticket', ticket_id);
    return ticket;
  }

  static async addMessage(sender_id: string, ticket_id: string, message: string) {
    return TicketRepository.addMessage({ sender_id, ticket_id, message });
  }

  static async getTickets(page: number, limit: number) {
    const offset = (page - 1) * limit;
    return TicketRepository.getTickets(limit, offset);
  }
}
