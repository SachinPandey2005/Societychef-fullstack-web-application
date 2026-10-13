import { create } from 'zustand';

interface DashboardState {
  dateRange: 'today' | 'week' | 'month' | 'all';
  setDateRange: (range: 'today' | 'week' | 'month' | 'all') => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  societyFilter: string;
  setSocietyFilter: (society: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dateRange: 'today',
  setDateRange: (dateRange) => set({ dateRange }),
  statusFilter: 'all',
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  societyFilter: 'all',
  setSocietyFilter: (societyFilter) => set({ societyFilter }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  currentPage: 1,
  setCurrentPage: (currentPage) => set({ currentPage }),
  resetFilters: () => set({ dateRange: 'today', statusFilter: 'all', societyFilter: 'all', searchQuery: '', currentPage: 1 })
}));
