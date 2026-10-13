import { create } from 'zustand';
import { FAQItem } from '../api/support.api';

interface FAQState {
  faqs: FAQItem[];
  filteredFaqs: FAQItem[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  setFaqs: (faqs: FAQItem[]) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFAQStore = create<FAQState>((set, get) => ({
  faqs: [],
  filteredFaqs: [],
  searchQuery: '',
  isLoading: false,
  error: null,

  setFaqs: (faqs) => set({ faqs, filteredFaqs: faqs, error: null }),
  setSearchQuery: (searchQuery) => {
    const { faqs } = get();
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      set({ searchQuery, filteredFaqs: faqs });
      return;
    }

    const filtered = faqs.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    set({ searchQuery, filteredFaqs: filtered });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default useFAQStore;
