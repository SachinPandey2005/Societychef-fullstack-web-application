import { Request, Response } from 'express';
import { ComplianceService } from '../services/compliance.service';
import { sendError, sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

export class ComplianceController {
  static async exportData(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'Unauthorized', null, 401);

      const data = await ComplianceService.exportUserData(userId);
      sendSuccess(res, 'Export successful', data);
    } catch (err) {
      logger.error('Data export failed', err);
      sendError(res, 'Internal Server Error', null, 500);
    }
  }

  static async requestDeletion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return sendError(res, 'Unauthorized', null, 401);

      await ComplianceService.requestDataDeletion(userId);
      sendSuccess(res, 'Deletion request received and is processing');
    } catch (err) {
      logger.error('Deletion request failed', err);
      sendError(res, 'Internal Server Error', null, 500);
    }
  }
}
