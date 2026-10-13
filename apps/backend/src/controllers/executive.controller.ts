import { Request, Response } from 'express';
import { SupportService } from '../services/support.service';
import { logger } from '../utils/logger';

export class ExecutiveController {
  /**
   * Stage 15: Executive Dashboard Aggregation
   */
  static async getMasterDashboard(req: Request, res: Response) {
    try {
      // In production, these calls would pull from an in-memory cache to prevent heavy DB locks.
      const supportStatus = await SupportService.getSlaStatus();
      
      const dashboard = {
        business: {
          mrr: 154000,
          growthRatePct: 12.5,
          activeSubscriptions: 42
        },
        operations: supportStatus,
        technology: {
          uptimePct: 99.99,
          errorRatePct: 0.01,
          apiHealth: 'GREEN'
        },
        enterprise: {
          totalTenants: 15,
          regions: ['US-East', 'EU-West', 'AP-South']
        }
      };

      res.json(dashboard);
    } catch (err) {
      logger.error('Executive Dashboard failed to load', err);
      res.status(500).json({ error: 'Dashboard Error' });
    }
  }
}
