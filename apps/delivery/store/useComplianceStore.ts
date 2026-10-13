import { create } from 'zustand';
import { ComplianceDoc } from '../api/settings.api';

interface ComplianceState {
  documents: ComplianceDoc[];
  isLoading: boolean;
  error: string | null;

  setDocuments: (documents: ComplianceDoc[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useComplianceStore = create<ComplianceState>((set) => ({
  documents: [],
  isLoading: false,
  error: null,

  setDocuments: (documents) => set({ documents, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default useComplianceStore;
