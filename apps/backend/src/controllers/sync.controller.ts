import { Request, Response } from 'express';
import { SyncService } from '../services/sync.service';
import { logger } from '../utils/logger';

export class SyncController {
  static async syncOrders(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const sinceParam = req.query.since as string;
      const since = sinceParam ? new Date(sinceParam) : null;

      const data = await SyncService.getOrdersDelta(userId, since);
      res.json({
        data,
        nextSyncToken: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Sync failed', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async syncMenus(req: Request, res: Response) {
    try {
      const zoneId = (req.query.zoneId as string) || 'default_zone';
      const sinceParam = req.query.since as string;
      const since = sinceParam ? new Date(sinceParam) : null;

      const data = await SyncService.getMenusDelta(zoneId, since);
      res.json({
        data,
        nextSyncToken: new Date().toISOString()
      });
    } catch (err) {
      logger.error('Sync failed', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
