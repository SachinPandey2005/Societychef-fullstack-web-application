export interface SmsProvider {
  /** Sends an OTP to the given phone number. Throws on failure. */
  sendOtp(phone: string): Promise<void>;
  /** Returns true if the given code is valid for this phone number. */
  verifyOtp(phone: string, code: string): Promise<boolean>;
}
