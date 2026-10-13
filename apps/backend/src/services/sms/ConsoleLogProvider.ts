import { SmsProvider } from './SmsProvider';
import { logger } from '../../utils/logger';

// Used when MSG91_AUTH_KEY/MSG91_OTP_TEMPLATE_ID aren't configured, so local
// dev and CI keep working without a real MSG91 account — same spirit as the
// existing ALLOW_DEV_BYPASS fixed-code path, but for the real send/verify
// call sites rather than a bypass around them entirely. Codes are generated
// per-phone and held in memory only; never use this in production (the
// factory that picks this provider already gates that).
export class ConsoleLogProvider implements SmsProvider {
  private codes = new Map<string, { code: string; expiresAt: number }>();

  async sendOtp(phone: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.codes.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    logger.info(`[ConsoleLogProvider] OTP for ${phone}: ${code} (expires in 5 min)`);
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const entry = this.codes.get(phone);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.codes.delete(phone);
      return false;
    }
    const matches = entry.code === code;
    if (matches) this.codes.delete(phone);
    return matches;
  }
}
