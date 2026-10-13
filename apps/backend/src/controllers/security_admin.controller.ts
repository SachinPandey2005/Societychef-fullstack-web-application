import { Request, Response } from 'express';
import { desc } from 'drizzle-orm';
import { AuditRepository } from '../repositories/audit.repository';
import { logger } from '../utils/logger';
import { db } from '../db/client';
import { profiles } from '../db/schema';

export class SecurityAdminController {
  /**
   * Retrieves active users across the platform. Restricted to Admins.
   *
   * Previously called supabase.auth.admin.listUsers(), which depended on
   * Supabase Auth owning the user list — now that profiles is the sole
   * source of truth for users (confirmed via AuthRepository.findProfileById
   * throughout this codebase), queried directly instead. There's no
   * real "last sign in" signal persisted anywhere (SessionService's session
   * tracking is in-memory only, not queryable by user), so this reports
   * profile creation time as the closest available proxy rather than
   * fabricating a last-sign-in timestamp.
   */
  static async getActiveSessions(req: Request, res: Response) {
    try {
      const rows = await db
        .select({ id: profiles.id, email: profiles.email, phone: profiles.phone, createdAt: profiles.createdAt })
        .from(profiles)
        .orderBy(desc(profiles.createdAt))
        .limit(100);

      const activeUsers = rows.map((u) => ({
        userId: u.id,
        email: u.email || u.phone,
        lastSignIn: u.createdAt,
      }));

      res.json({ sessions: activeUsers });
    } catch (err) {
      logger.error('Failed to retrieve active sessions', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Retrieve compliance requests (e.g. data export requests, deletion requests).
   *
   * compliance_requests never existed (confirmed absent from the live
   * schema dump, and from the introspected Drizzle schema). Left as an
   * empty result rather than queried against nothing, consistent with the
   * original code's own defensive handling of this table potentially not
   * existing.
   */
  static async getComplianceRequests(req: Request, res: Response) {
    res.json({ requests: [] });
  }

  /**
   * Audits security actions taken by Admins.
   */
  static async triggerAuditReport(req: Request, res: Response) {
    try {
      await AuditRepository.logSecurityEvent({
        actor_id: req.user?.id || 'system',
        event_type: 'AUDIT_REPORT_GENERATED'
      });
      res.json({ message: 'Audit report generation started' });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
