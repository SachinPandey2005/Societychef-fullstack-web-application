export type TicketStatus = 
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Ticket {
  id: string;
  customer_id: string;
  assigned_to?: string; // Support agent profile ID
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  order_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string; // Customer or Support Agent
  message: string;
  created_at?: string;
}
