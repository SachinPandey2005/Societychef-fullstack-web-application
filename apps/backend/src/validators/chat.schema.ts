import { z } from 'zod';

export const createMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    media_url: z.string().url().optional()
  })
});

export const threadIdSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('Invalid Thread ID'),
  })
});

export const getConversationByOrderSchema = z.object({
  query: z.object({
    order_id: z.string().uuid('Invalid Order ID'),
  })
});

export const supportConversationSchema = z.object({
  body: z.object({
    receiver_id: z.string().uuid('Invalid Receiver ID'),
    message: z.string().min(1).max(2000),
    media_url: z.string().url().optional()
  })
});

export const typingIndicatorSchema = z.object({
  body: z.object({
    is_typing: z.boolean()
  })
});

export const getOrCreateThreadSchema = z.object({
  body: z.object({
    kitchen_id: z.string().uuid('Invalid Kitchen ID'),
  })
});
