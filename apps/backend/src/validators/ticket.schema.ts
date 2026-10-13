import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid(),
    subject: z.string().min(1).max(100),
    description: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  })
});

export const updateTicketStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']),
  })
});

export const addTicketMessageSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    message: z.string().min(1),
  })
});

export const createMyTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(1).max(100),
    description: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    category: z.enum(['DELIVERY_ISSUE', 'PICKUP_ISSUE', 'CUSTOMER_ISSUE', 'CHEF_ISSUE', 'PAYMENT_ISSUE', 'WALLET_ISSUE', 'TECHNICAL_ISSUE', 'ACCOUNT_ISSUE', 'SAFETY_ISSUE', 'EMERGENCY', 'OTHER']).optional(),
    order_id: z.string().uuid().optional(),
  })
});
