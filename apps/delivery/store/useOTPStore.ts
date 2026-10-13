import { create } from 'zustand';

interface OTPState {
  enteredOtp: string;
  isOtpVerified: boolean;
  attemptCount: number;
  maxAttempts: number;
  isRateLimited: boolean;
  errorMsg: string | null;

  setEnteredOtp: (otp: string) => void;
  setOtpVerified: (verified: boolean) => void;
  incrementAttempts: () => void;
  setErrorMsg: (msg: string | null) => void;
  resetOtpState: () => void;
}

export const useOTPStore = create<OTPState>((set, get) => ({
  enteredOtp: '',
  isOtpVerified: false,
  attemptCount: 0,
  maxAttempts: 3,
  isRateLimited: false,
  errorMsg: null,

  setEnteredOtp: (enteredOtp) => set({ enteredOtp, errorMsg: null }),
  setOtpVerified: (isOtpVerified) => set({ isOtpVerified, errorMsg: null }),
  incrementAttempts: () => {
    const nextCount = get().attemptCount + 1;
    const isLimited = nextCount >= get().maxAttempts;
    set({
      attemptCount: nextCount,
      isRateLimited: isLimited,
      errorMsg: isLimited
        ? 'Maximum OTP retry attempts exceeded. Please request CRM dispatch support.'
        : `Invalid OTP. ${get().maxAttempts - nextCount} attempt(s) remaining.`,
    });
  },
  setErrorMsg: (errorMsg) => set({ errorMsg }),
  resetOtpState: () =>
    set({
      enteredOtp: '',
      isOtpVerified: false,
      attemptCount: 0,
      isRateLimited: false,
      errorMsg: null,
    }),
}));
