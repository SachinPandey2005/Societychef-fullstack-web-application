import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class DeveloperController {
  /**
   * Stage 13: Developer Portal APIs
   */
  static async generateApiKey(req: Request, res: Response) {
    logger.info(`Generating API key for user ${req.user?.id}`);
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}`;
    res.json({ apiKey: newKey });
  }

  static async listWebhooks(req: Request, res: Response) {
    res.json({ webhooks: [] });
  }
}
