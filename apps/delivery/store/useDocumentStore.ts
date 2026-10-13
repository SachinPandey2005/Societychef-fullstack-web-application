import { create } from 'zustand';
import { partnerApi, PartnerProfileResponse } from '../api/partner.api';

interface DocumentState {
  documents: PartnerProfileResponse['documents'];
  isLoading: boolean;
  error: string | null;

  loadDocuments: () => Promise<void>;
  uploadDocument: (type: string, url: string, expiryDate?: string, skipProfileRefresh?: boolean) => Promise<void>;
  uploadSelfie: (url: string, skipProfileRefresh?: boolean) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  isLoading: false,
  error: null,

  loadDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await partnerApi.getProfile();
      set({ documents: data.documents || [] });
    } catch (e: any) {
      set({ error: e.message || 'Failed to load documents list' });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (type, url, expiryDate, skipProfileRefresh = false) => {
    set({ isLoading: true, error: null });
    try {
      await partnerApi.uploadDocument(type, url, expiryDate);
      if (!skipProfileRefresh) {
        const data = await partnerApi.getProfile();
        set({ documents: data.documents || [] });
      }
    } catch (e: any) {
      set({ error: e.message || 'Failed to upload document' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  uploadSelfie: async (url, skipProfileRefresh = false) => {
    set({ isLoading: true, error: null });
    try {
      await partnerApi.uploadSelfie(url);
      if (!skipProfileRefresh) {
        const data = await partnerApi.getProfile();
        set({ documents: data.documents || [] });
      }
    } catch (e: any) {
      set({ error: e.message || 'Failed to upload selfie verification' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useDocumentStore;
