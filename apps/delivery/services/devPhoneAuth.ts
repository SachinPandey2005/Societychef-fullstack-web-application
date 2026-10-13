import { CONFIG } from '../config';

/**
 // TEMP DEV-ONLY: Dedicated helper for Delivery Partner App dev phone auth bypass.
 // Remove once real OTP provider (Firebase/Twilio/Supabase/etc.) is integrated.
 */
export const FIXED_DEV_OTP = '123456';

export class DevPhoneAuthService {
  /**
   * Checks whether the temporary dev phone auth flag is enabled.
   * Always returns false in production builds.
   */
  static isDevAuthEnabled(): boolean {
    if (typeof process !== 'undefined' && (process.env?.EXPO_PUBLIC_DEV_PHONE_AUTH === 'true' || process.env?.DEV_PHONE_AUTH === 'true')) {
      return true;
    }
    if (typeof process !== 'undefined' && (process.env?.EXPO_PUBLIC_DEV_PHONE_AUTH === 'false' || process.env?.DEV_PHONE_AUTH === 'false')) {
      return false;
    }
    if (typeof CONFIG !== 'undefined' && CONFIG.DEV_PHONE_AUTH !== undefined) {
      return Boolean(CONFIG.DEV_PHONE_AUTH);
    }
    return typeof __DEV__ !== 'undefined' && __DEV__;
  }

  /**
   * Determines whether SMS provider calls should be skipped during OTP send.
   */
  static shouldSkipOtpSend(): boolean {
    // TEMP DEV-ONLY: Short-circuit OTP send step when dev auth is enabled
    return this.isDevAuthEnabled();
  }

  /**
   * Validates entered OTP code against the fixed dev values ('123456' or '12345').
   */
  static validateDevOtp(code: string): boolean {
    // TEMP DEV-ONLY: Compare against fixed OTP code '123456' or '12345'
    if (!this.isDevAuthEnabled()) {
      return false;
    }
    const trimmed = code.trim();
    return trimmed === FIXED_DEV_OTP || trimmed === '12345';
  }

  /**
   * Returns the expected fixed dev OTP code string.
   */
  static getFixedOtpCode(): string {
    // TEMP DEV-ONLY: Fixed OTP value
    return FIXED_DEV_OTP;
  }
}

export default DevPhoneAuthService;
