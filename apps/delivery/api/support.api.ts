import { apiClient } from './client';

export interface TicketItem {
  id: string;
  profile_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: 'OPEN' | 'RESOLVED';
  order_id: string | null;
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportChatMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const supportApi = {
  getTickets: async (): Promise<TicketItem[]> => {
    const response = await apiClient.get<TicketItem[]>('/support/tickets');
    return response.data;
  },

  createTicket: async (params: {
    category: string;
    priority?: string;
    description: string;
    orderId?: string | null;
  }): Promise<TicketItem> => {
    const response = await apiClient.post<TicketItem>('/support/tickets', params);
    return response.data;
  },

  getTicketDetails: async (ticketId: string): Promise<{ ticket: TicketItem; messages: SupportChatMessage[] }> => {
    const response = await apiClient.get<{ ticket: TicketItem; messages: SupportChatMessage[] }>(`/support/tickets/${ticketId}`);
    return response.data;
  },

  sendChatMessage: async (params: {
    ticketId: string;
    message: string;
    mediaUrl?: string | null;
  }): Promise<SupportChatMessage> => {
    const response = await apiClient.post<SupportChatMessage>('/support/chat', params);
    return response.data;
  },

  getFaqs: async (category?: string): Promise<FAQItem[]> => {
    const endpoint = category ? `/faq?category=${category}` : '/faq';
    const response = await apiClient.get<FAQItem[]>(endpoint);
    return response.data;
  },

  submitFeedback: async (params: {
    feedbackType: string;
    description: string;
  }): Promise<any> => {
    const response = await apiClient.post('/partner/feedback', params);
    return response.data;
  },
};

export default supportApi;
