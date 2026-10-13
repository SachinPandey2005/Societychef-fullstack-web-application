import { supportApi } from '../api/support.api';
import { useSupportStore } from '../store/useSupportStore';

export class SupportRepository {
  static async fetchTickets(): Promise<void> {
    const store = useSupportStore.getState();
    store.setLoading(true);
    try {
      const tickets = await supportApi.getTickets();
      if (tickets) store.setTickets(tickets);
    } catch (e: any) {
      console.warn('[SupportRepository] Fetch tickets error:', e.message);
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  }

  static async createTicket(category: string, description: string, orderId?: string | null): Promise<any> {
    const store = useSupportStore.getState();
    store.setLoading(true);
    try {
      const ticket = await supportApi.createTicket({ category, description, orderId });
      if (ticket) {
        store.setTickets([ticket, ...store.tickets]);
        return ticket;
      }
    } catch (e: any) {
      console.warn('[SupportRepository] Create ticket error:', e.message);
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  }

  static async fetchTicketDetails(ticketId: string): Promise<void> {
    const store = useSupportStore.getState();
    store.setLoading(true);
    try {
      const data = await supportApi.getTicketDetails(ticketId);
      if (data) {
        store.setActiveTicket(data.ticket);
        store.setChatMessages(data.messages);
      }
    } catch (e: any) {
      console.warn('[SupportRepository] Fetch ticket detail error:', e.message);
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  }

  static async sendChatMessage(ticketId: string, message: string, mediaUrl?: string | null): Promise<void> {
    const store = useSupportStore.getState();
    store.setSending(true);
    try {
      const msg = await supportApi.sendChatMessage({ ticketId, message, mediaUrl });
      if (msg) {
        store.addChatMessage(msg);
      }
    } catch (e: any) {
      console.warn('[SupportRepository] Send chat message error:', e.message);
      store.setError(e.message);
      throw e;
    } finally {
      store.setSending(false);
    }
  }

  static async submitFeedback(feedbackType: string, description: string): Promise<void> {
    const store = useSupportStore.getState();
    store.setLoading(true);
    try {
      await supportApi.submitFeedback({ feedbackType, description });
    } catch (e: any) {
      console.warn('[SupportRepository] Submit feedback error:', e.message);
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  }
}

export default SupportRepository;
