import { z } from 'zod';

export const createComplaintSchema = z.object({
  body: z.object({
    reporter_id: z.string().uuid(),
    target_id: z.string().uuid().optional(),
    type: z.enum([
      'FOOD_QUALITY', 'LATE_DELIVERY', 'MISSING_ITEM', 
      'PAYMENT_ISSUE', 'REFUND_ISSUE', 'KITCHEN_HYGIENE', 
      'CHEF_BEHAVIOUR', 'CUSTOMER_BEHAVIOUR', 'TECHNICAL_ISSUE'
    ]),
    description: z.string().min(1),
  })
});

export const updateComplaintStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED']),
    resolution_notes: z.string().optional(),
  })
});
