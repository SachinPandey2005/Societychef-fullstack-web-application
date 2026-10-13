import { db } from '../db/client';
import { auditLogs } from '../db/schema';
import { logger } from '../utils/logger';

// Same audit_logs table as crm.repository.ts's createAuditLog, with a
// different set of wrong column names: event_type/target_id/target_type/
// metadata don't exist (real: action/entity_id/entity_type, no generic
// metadata column — it's previous_data/new_data). Every call here was
// silently swallowing a real DB error (caught, only logger.error'd).
export class AuditRepository {
  /**
   * Log an immutable security event.
   */
  static async logSecurityEvent(payload: {
    actor_id: string;
    event_type: string;
    target_id?: string;
    target_type?: string;
    metadata?: any;
    ip_address?: string;
  }) {
    logger.info(`SECURITY_EVENT [${payload.event_type}] actor: ${payload.actor_id}`);

    try {
      await db.insert(auditLogs).values({
        actorId: payload.actor_id,
        action: payload.event_type,
        module: payload.target_type || 'SECURITY',
        entityType: payload.target_type,
        entityId: payload.target_id,
        newData: payload.metadata,
        ipAddress: payload.ip_address,
      });
    } catch (error) {
      logger.error('Failed to write to audit log:', error);
      // Depending on strictness, we might want to throw here if audit is mandatory
    }
  }
}
