import { logger } from '../utils/logger';
import { LRUCache } from 'lru-cache';

// Tracks active sessions keyed by the raw bearer token — a previous version
// keyed this by a randomly generated sessionId that was never returned to
// the client anywhere, so nothing could ever look itself up here and
// revocation/concurrent-session-limits were unreachable dead code. The
// token itself is the only session identifier every request actually
// carries (via the Authorization header), so it's used as the key here too.
const sessionCache = new LRUCache<string, { userId: string; active: boolean; deviceId?: string }>({
  max: 5000,
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

// A secondary cache to map userId to an array of tokens for concurrent limit enforcement
const userSessionsCache = new LRUCache<string, string[]>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24 * 7,
});

export class SessionService {
  /**
   * Tracks an active JWT session, called on login.
   * In a real implementation this would go to a Redis cache or a highly optimized SQL table.
   */
  static async registerSession(userId: string, token: string, deviceId?: string) {
    logger.info(`Registering session for user: ${userId}`);

    await this.enforceConcurrentLimits(userId);

    sessionCache.set(token, { userId, active: true, deviceId });

    const userSessions = userSessionsCache.get(userId) || [];
    userSessions.push(token);
    userSessionsCache.set(userId, userSessions);

    return { userId, active: true };
  }

  /**
   * Invalidates a specific session, rendering the token unusable — called
   * on logout, before the token's own JWT expiry.
   */
  static async revokeSession(token: string) {
    logger.info('Revoking session');
    const session = sessionCache.get(token);
    if (session) {
      sessionCache.set(token, { ...session, active: false });
    } else {
      // Not previously registered (e.g. issued before this tracking existed) —
      // still record it as revoked so a subsequent isSessionActive check rejects it.
      sessionCache.set(token, { userId: '', active: false });
    }
    return true;
  }

  /**
   * Checked in auth middleware on every authenticated request. A token that
   * was never explicitly revoked is treated as active by default — this is
   * an additional early-revocation layer on top of Supabase's own JWT
   * validity, not a replacement allowlist (so tokens issued before this
   * tracking existed keep working normally).
   */
  static async isSessionActive(token: string): Promise<boolean> {
    const session = sessionCache.get(token);
    return session ? session.active : true;
  }

  /**
   * Enforces concurrent session limits for a user (e.g. max 3 devices).
   */
  static async enforceConcurrentLimits(userId: string, maxSessions: number = 3) {
    logger.info(`Enforcing concurrent limits for user: ${userId}`);
    const sessions = userSessionsCache.get(userId) || [];

    // Filter out inactive sessions
    const activeSessions = sessions.filter(t => sessionCache.get(t)?.active);

    if (activeSessions.length >= maxSessions) {
      // Revoke the oldest session
      const oldestSession = activeSessions.shift();
      if (oldestSession) {
        await this.revokeSession(oldestSession);
      }
    }

    userSessionsCache.set(userId, activeSessions);
  }

  static getActiveSessionCount(): number {
    return sessionCache.size;
  }
}
