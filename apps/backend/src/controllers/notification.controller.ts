import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';
import { markReadSchema, registerDeviceSchema, updatePreferencesSchema } from '../validators/notification.schema';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const notifications = await NotificationService.getNotifications(profile_id);
  sendSuccess(res, 'Notifications retrieved', notifications);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = markReadSchema.parse({ body: req.body });
  
  await NotificationService.markAsRead(profile_id, body.notification_ids);
  sendSuccess(res, 'Notifications marked as read');
});

export const registerDevice = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = registerDeviceSchema.parse({ body: req.body });
  
  const tokenRecord = await NotificationService.registerDevice(profile_id, body.token);
  sendSuccess(res, 'Device registered for push notifications', tokenRecord);
});

export const getPreferences = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const preferences = await NotificationService.getPreferences(profile_id);
  sendSuccess(res, 'Preferences retrieved', preferences);
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = updatePreferencesSchema.parse({ body: req.body });
  
  const preferences = await NotificationService.updatePreferences(profile_id, body);
  sendSuccess(res, 'Preferences updated', preferences);
});
