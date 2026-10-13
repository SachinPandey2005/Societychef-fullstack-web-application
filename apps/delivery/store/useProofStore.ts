import { create } from 'zustand';

interface ProofState {
  signatureData: string | null;
  photoUri: string | null;
  timestamp: string | null;
  isUploaded: boolean;

  setSignatureData: (signatureData: string | null) => void;
  setPhotoUri: (photoUri: string | null) => void;
  setUploaded: (uploaded: boolean) => void;
  resetProof: () => void;
}

export const useProofStore = create<ProofState>((set) => ({
  signatureData: null,
  photoUri: null,
  timestamp: null,
  isUploaded: false,

  setSignatureData: (signatureData) => set({ signatureData, timestamp: new Date().toISOString() }),
  setPhotoUri: (photoUri) => set({ photoUri, timestamp: new Date().toISOString() }),
  setUploaded: (isUploaded) => set({ isUploaded }),
  resetProof: () =>
    set({
      signatureData: null,
      photoUri: null,
      timestamp: null,
      isUploaded: false,
    }),
}));
