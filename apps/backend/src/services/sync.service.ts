import { logger } from '../utils/logger';

export class SyncService {
  /**
   * Stage 3 & 4: Offline Synchronization Framework
   * Returns records updated or deleted since the provided timestamp.
   */
  static async getOrdersDelta(userId: string, since: Date | null) {
    logger.info(`Fetching order delta for user ${userId} since ${since}`);
    // Stub implementation: Returns dummy data if since is provided
    if (!since) {
      return {
        updated: [{ id: 'order-1', status: 'COMPLETED' }],
        deleted: []
      };
    }
    
    // Simulating only returning what changed
    return {
      updated: [],
      deleted: [{ id: 'order-old-2' }]
    };
  }

  static async getMenusDelta(zoneId: string, since: Date | null) {
    logger.info(`Fetching menu delta for zone ${zoneId} since ${since}`);
    return {
      updated: [{ id: 'menu-item-3', price: 250 }],
      deleted: []
    };
  }
}
