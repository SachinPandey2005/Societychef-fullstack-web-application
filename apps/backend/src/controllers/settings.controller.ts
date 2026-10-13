import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { SettingsService } from '../services/settings.service';
import { sendSuccess } from '../utils/response';
import { updateSettingSchema } from '../validators/settings.schema';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await SettingsService.getAllSettings();
  sendSuccess(res, 'Settings retrieved', settings);
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updateSettingSchema.parse({ params: req.params, body: req.body });
  
  const updated = await SettingsService.updateSetting(params.key, body.value, admin_id);
  sendSuccess(res, 'Setting updated successfully', updated);
});
