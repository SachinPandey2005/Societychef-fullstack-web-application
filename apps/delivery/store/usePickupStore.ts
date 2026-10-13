import { create } from 'zustand';

export interface PickupChecklistState {
  foodPackageReceived: boolean;
  correctQuantity: boolean;
  packagingIntact: boolean;
  sealIntact: boolean;
  temperatureChecked: boolean;
  instructionsVerified: boolean;
  [key: string]: boolean;
}

interface PickupState {
  checklist: PickupChecklistState;
  chefPin: string;
  isPinVerified: boolean;
  isSubmitting: boolean;

  setChecklistItem: (key: keyof PickupChecklistState, value: boolean) => void;
  setChefPin: (pin: string) => void;
  setPinVerified: (verified: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  resetPickup: () => void;
}

const initialChecklist: PickupChecklistState = {
  foodPackageReceived: false,
  correctQuantity: false,
  packagingIntact: false,
  sealIntact: false,
  temperatureChecked: false,
  instructionsVerified: false,
};

export const usePickupStore = create<PickupState>((set) => ({
  checklist: initialChecklist,
  chefPin: '',
  isPinVerified: false,
  isSubmitting: false,

  setChecklistItem: (key, value) =>
    set((state) => ({
      checklist: { ...state.checklist, [key]: value },
    })),

  setChefPin: (chefPin) => set({ chefPin }),
  setPinVerified: (isPinVerified) => set({ isPinVerified }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  resetPickup: () =>
    set({
      checklist: initialChecklist,
      chefPin: '',
      isPinVerified: false,
      isSubmitting: false,
    }),
}));
