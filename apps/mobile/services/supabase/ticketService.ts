import { apiClient } from '../../lib/apiClient';

export interface Ticket {
  id: string;
  profile_id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  category?: 'DELIVERY_ISSUE' | 'PICKUP_ISSUE' | 'CUSTOMER_ISSUE' | 'CHEF_ISSUE' | 'PAYMENT_ISSUE' | 'WALLET_ISSUE' | 'TECHNICAL_ISSUE' | 'ACCOUNT_ISSUE' | 'SAFETY_ISSUE' | 'EMERGENCY' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  order_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  media_url?: string | null;
  is_read?: boolean;
  created_at: string;
}

/**
 * Fetch all support tickets for the current authenticated user, via the
 * backend's self-service /tickets endpoint (apps/backend/src/routes/ticket.routes.ts).
 * Previously this called Supabase directly and silently fell back to
 * hardcoded mock tickets on any error — a real failure looked identical to
 * "you have two old tickets." Errors now propagate so the UI can show one.
 */
export async function fetchUserTickets(): Promise<Ticket[]> {
  const response = await apiClient.get('/tickets');
  return (response?.data || []) as Ticket[];
}

export async function createTicket(payload: {
  subject: string;
  description: string;
  category?: string;
  priority?: string;
  order_id?: string;
}): Promise<Ticket> {
  const response = await apiClient.post('/tickets', payload);
  return response.data as Ticket;
}

export async function fetchTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const response = await apiClient.get(`/tickets/${ticketId}/messages`);
  return (response?.data || []) as TicketMessage[];
}

export async function sendTicketMessage(ticketId: string, messageText: string): Promise<TicketMessage> {
  const response = await apiClient.post(`/tickets/${ticketId}/messages`, { message: messageText });
  return response.data as TicketMessage;
}
