import { logger } from '../utils/logger';

export class EmailService {
  static async sendEmail(to: string, subject: string, body: string, htmlBody?: string): Promise<boolean> {
    try {
      // Stub for SendGrid / AWS SES integration
      logger.info(`[EMAIL OUTBOUND] To: ${to} | Subject: ${subject}`);
      
      // Simulate network request
      await new Promise(res => setTimeout(res, 500));
      
      return true;
    } catch (error) {
      logger.error('Failed to send email', error);
      throw error;
    }
  }
}
