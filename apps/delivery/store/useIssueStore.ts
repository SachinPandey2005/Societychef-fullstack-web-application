import { create } from 'zustand';

export type IssueType =
  | 'CUSTOMER_UNAVAILABLE'
  | 'WRONG_ADDRESS'
  | 'BUILDING_ACCESS_DENIED'
  | 'PACKAGE_DAMAGED'
  | 'ORDER_MISSING_ITEMS'
  | 'EMERGENCY_SOS'
  | 'OTHER';

interface IssueState {
  issueType: IssueType;
  notes: string;
  photoUris: string[];
  activeTicketId: string | null;
  isSosTriggered: boolean;

  setIssueType: (type: IssueType) => void;
  setNotes: (notes: string) => void;
  addPhotoUri: (uri: string) => void;
  setTicketId: (id: string | null) => void;
  setSosTriggered: (triggered: boolean) => void;
  resetIssue: () => void;
}

export const useIssueStore = create<IssueState>((set) => ({
  issueType: 'CUSTOMER_UNAVAILABLE',
  notes: '',
  photoUris: [],
  activeTicketId: null,
  isSosTriggered: false,

  setIssueType: (issueType) => set({ issueType }),
  setNotes: (notes) => set({ notes }),
  addPhotoUri: (uri) => set((state) => ({ photoUris: [...state.photoUris, uri] })),
  setTicketId: (activeTicketId) => set({ activeTicketId }),
  setSosTriggered: (isSosTriggered) => set({ isSosTriggered }),
  resetIssue: () =>
    set({
      issueType: 'CUSTOMER_UNAVAILABLE',
      notes: '',
      photoUris: [],
      activeTicketId: null,
      isSosTriggered: false,
    }),
}));
