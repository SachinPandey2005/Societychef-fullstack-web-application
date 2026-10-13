import { logger } from '../utils/logger';

export class SmsService {
  static async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Stub for Twilio integration
      logger.info(`[SMS OUTBOUND] To: ${phoneNumber} | Message: ${message}`);
      
      // Simulate network request
      await new Promise(res => setTimeout(res, 500));
      
      return true;
    } catch (error) {
      logger.error('Failed to send SMS', error);
      throw error;
    }
  }
}
