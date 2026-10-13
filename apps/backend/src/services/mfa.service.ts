import { logger } from '../utils/logger';
import { internalEventBus, EVENTS } from '../events/eventEmitter';

export class MFAService {
  /**
   * Generates a TOTP secret for the user to scan via QR Code.
   *
   * NOT IMPLEMENTED: no TOTP library is wired in and no per-user secret is
   * persisted anywhere. This previously returned a fake literal secret;
   * that made verifyToken() below trivially bypassable with a hardcoded
   * code. Currently unreachable from any route — keep it that way until
   * this is built for real (otplib + a secrets table).
   */
  static async generateSecret(userId: string): Promise<never> {
    logger.info(`MFA generateSecret requested for user ${userId} but MFA is not implemented`);
    throw new Error('MFA is not implemented');
  }

  /**
   * Verifies the provided token against the user's secret.
   *
   * NOT IMPLEMENTED — see generateSecret(). Must fail closed, never
   * accept a hardcoded/placeholder code.
   */
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    logger.info(`MFA verifyToken requested for user ${userId} but MFA is not implemented`);
    throw new Error('MFA is not implemented');
  }

  /**
   * Evaluates if MFA is required based on role and current risk context.
   */
  static isMFARequired(role: string, contextRiskScore: number): boolean {
    if (role === 'admin' || role === 'ops') return true;
    if (contextRiskScore > 70) {
      internalEventBus.emit(EVENTS.MFA_REQUIRED, { role, contextRiskScore });
      return true;
    }
    return false;
  }
}
