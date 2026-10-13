import { create } from 'zustand';
import { TicketItem, SupportChatMessage } from '../api/support.api';

interface SupportState {
  tickets: TicketItem[];
  activeTicket: TicketItem | null;
  chatMessages: SupportChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  setTickets: (tickets: TicketItem[]) => void;
  setActiveTicket: (ticket: TicketItem | null) => void;
  setChatMessages: (messages: SupportChatMessage[]) => void;
  addChatMessage: (message: SupportChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  tickets: [],
  activeTicket: null,
  chatMessages: [],
  isLoading: false,
  isSending: false,
  error: null,

  setTickets: (tickets) => set({ tickets, error: null }),
  setActiveTicket: (activeTicket) => set({ activeTicket }),
  setChatMessages: (chatMessages) => set({ chatMessages, error: null }),
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setLoading: (isLoading) => set({ isLoading }),
  setSending: (isSending) => set({ isSending }),
  setError: (error) => set({ error }),
}));

export default useSupportStore;
