import { create } from 'zustand';

export type ExecutionStep =
  | 'REACHED_CHEF'
  | 'FOOD_PICKED'
  | 'HEADING_TO_CUSTOMER'
  | 'REACHED_CUSTOMER'
  | 'OTP_VERIFIED'
  | 'PROOF_UPLOADED'
  | 'DELIVERED';

interface DeliveryState {
  currentStep: ExecutionStep;
  gateNotes: string;
  isDelivered: boolean;
  isSubmitting: boolean;

  setCurrentStep: (step: ExecutionStep) => void;
  setGateNotes: (notes: string) => void;
  setDelivered: (delivered: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  currentStep: 'REACHED_CUSTOMER',
  gateNotes: 'Leave package at Gate 2 security if resident not answering call.',
  isDelivered: false,
  isSubmitting: false,

  setCurrentStep: (currentStep) => set({ currentStep }),
  setGateNotes: (gateNotes) => set({ gateNotes }),
  setDelivered: (isDelivered) => set({ isDelivered }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
}));
