import { z } from 'zod';

export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    content: z.string().min(10),
    category: z.string(),
    tags: z.array(z.string()).optional(),
  })
});

export const chatPromptSchema = z.object({
  body: z.object({
    session_id: z.string().uuid().optional(),
    message: z.string().min(1),
  })
});
