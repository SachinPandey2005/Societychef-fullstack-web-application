import { logger } from '../utils/logger';
import { internalEventBus } from '../events/eventEmitter';

export class MeteringService {
  /**
   * Stage 9: Tracks specific usage metrics per tenant to facilitate monthly billing
   */
  static async incrementUsage(tenantId: string, metric: 'API_CALLS' | 'AI_PREDICTIONS' | 'ORDERS', amount: number = 1) {
    // In production, this pushes to an in-memory batcher (e.g. Redis) before flushing to DB to avoid write locks
    if (tenantId === 'DEFAULT_GLOBAL_TENANT') return; // Do not meter root fallback

    // Stub
    // logger.debug(`Metered [${metric}] +${amount} for ${tenantId}`);

    // If limits hit, emit 'USAGE_THRESHOLD_REACHED'
    if (amount > 1000) {
      internalEventBus.emit('USAGE_THRESHOLD_REACHED', { tenantId, metric });
    }
  }
}
