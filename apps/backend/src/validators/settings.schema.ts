import { z } from 'zod';

export const updateSettingSchema = z.object({
  body: z.object({
    value: z.any()
  }),
  params: z.object({
    key: z.string()
  })
});
