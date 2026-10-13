import { Request, Response } from 'express';
import { PrivacyService } from '../services/privacy.service';
import { sendError, sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

export class PrivacyController {
  static async exportData(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'Unauthorized', null, 401);

      const data = await PrivacyService.exportUserData(userId);
      sendSuccess(res, 'User data exported successfully', data);
    } catch (error) {
      logger.error('Failed to export user data', error);
      sendError(res, 'Data export failed', null, 500);
    }
  }

  static async requestDeletion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'Unauthorized', null, 401);

      await PrivacyService.anonymizeUser(userId);
      sendSuccess(res, 'User data anonymized successfully per privacy policies.');
    } catch (error) {
      logger.error('Failed to process deletion request', error);
      sendError(res, 'Deletion request failed', null, 500);
    }
  }
}
