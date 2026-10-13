import { Request, Response } from 'express';
import { DeviceService } from '../services/device.service';
import { sendError, sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

export class DeviceController {
  static async register(req: Request, res: Response) {
    try {
      const { deviceId, pushToken } = req.body;
      const userId = req.user?.id;
      if (!userId || !deviceId) {
        return sendError(res, 'Missing required parameters', null, 400);
      }

      const result = await DeviceService.registerDevice(userId, deviceId, pushToken);
      sendSuccess(res, 'Device registered successfully', result);
    } catch (err) {
      logger.error('Failed to register device', err);
      sendError(res, 'Internal Server Error', null, 500);
    }
  }

  static async revoke(req: Request, res: Response) {
    try {
      const deviceId = req.params.deviceId as string;
      const userId = req.user?.id;
      if (!userId || !deviceId) {
        return sendError(res, 'Missing required parameters', null, 400);
      }

      const result = await DeviceService.revokeDevice(userId, deviceId);
      sendSuccess(res, 'Device revoked successfully', result);
    } catch (err) {
      logger.error('Failed to revoke device', err);
      sendError(res, 'Internal Server Error', null, 500);
    }
  }
}
