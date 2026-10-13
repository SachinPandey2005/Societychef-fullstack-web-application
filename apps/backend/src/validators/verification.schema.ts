import { z } from 'zod';

export const updateVerificationStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'REQUEST_RESUBMISSION', 'SUSPENDED']),
    verification_notes: z.string().optional(),
    notes: z.string().optional(),
  })
});
