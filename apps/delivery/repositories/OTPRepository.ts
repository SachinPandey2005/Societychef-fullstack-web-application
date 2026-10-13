import { executionHandoverApi } from '../api';
import { useOTPStore } from '../store/useOTPStore';

export class OTPRepository {
  static async verifyCustomerOtp(orderId: string, otp: string): Promise<boolean> {
    const otpStore = useOTPStore.getState();

    if (otpStore.isRateLimited) {
      throw new Error('Maximum OTP retries exceeded. Please contact dispatch support.');
    }

    try {
      await executionHandoverApi.verifyCustomerOtp(orderId, otp);
      otpStore.setOtpVerified(true);
      return true;
    } catch (e: any) {
      otpStore.incrementAttempts();
      otpStore.setOtpVerified(false);
      throw e;
    }
  }
}

export default OTPRepository;
