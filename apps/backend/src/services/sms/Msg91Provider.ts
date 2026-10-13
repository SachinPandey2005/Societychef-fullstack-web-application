import { SmsProvider } from './SmsProvider';
import { logger } from '../../utils/logger';

// MSG91's OTP widget API (https://docs.msg91.com/p/tf9GTextN/e/kBRvtVSb-l/MSG91)
// owns OTP generation, expiry and retry limits itself — there is no local
// otp_codes table here, the same way Supabase's GoTrue never needed the
// backend to store a code either. MSG91 expects the mobile number without a
// leading '+' (country code + number, e.g. "919876543210").
export class Msg91Provider implements SmsProvider {
  constructor(private readonly authKey: string, private readonly templateId: string) {}

  private toMsg91Format(phone: string): string {
    return phone.replace(/^\+/, '');
  }

  async sendOtp(phone: string): Promise<void> {
    const mobile = this.toMsg91Format(phone);
    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(this.templateId)}&mobile=${encodeURIComponent(mobile)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { authkey: this.authKey, 'Content-Type': 'application/json' },
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok || body.type !== 'success') {
      logger.error('[Msg91Provider] sendOtp failed', { status: res.status, body });
      throw new Error(body.message || 'Failed to send OTP via MSG91');
    }
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const mobile = this.toMsg91Format(phone);
    const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(code)}&mobile=${encodeURIComponent(mobile)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { authkey: this.authKey },
    });
    const body = await res.json().catch(() => ({}));

    if (body.type === 'success') return true;
    logger.warn('[Msg91Provider] verifyOtp rejected', { status: res.status, body });
    return false;
  }
}
