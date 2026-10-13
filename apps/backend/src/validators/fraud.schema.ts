import { z } from 'zod';

export const createFraudRuleSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string(),
    is_active: z.boolean(),
    priority: z.number().int().min(1),
    conditions: z.record(z.string(), z.any()),
    actions: z.array(z.enum(['LOG', 'WARN', 'REQUIRE_OTP', 'HOLD_REFUND', 'BLOCK_COUPON', 'RESTRICT_WALLET', 'FLAG_ACCOUNT', 'ESCALATE_TO_OPS'])),
  })
});

export const resolveFraudCaseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['RESOLVED', 'FALSE_POSITIVE']),
    resolution_notes: z.string().min(5),
  })
});
