import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    push_enabled: z.boolean().optional(),
    in_app_enabled: z.boolean().optional(),
    promotional_enabled: z.boolean().optional(),
  })
});

export const registerDeviceSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Expo push token is required'),
  })
});

export const markReadSchema = z.object({
  body: z.object({
    notification_ids: z.array(z.string().uuid()),
  })
});
