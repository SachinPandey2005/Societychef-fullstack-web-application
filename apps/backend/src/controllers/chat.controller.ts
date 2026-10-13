import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ChatService } from '../services/chat.service';
import { sendSuccess } from '../utils/response';
import { createMessageSchema, getConversationByOrderSchema, supportConversationSchema, typingIndicatorSchema, threadIdSchema, getOrCreateThreadSchema } from '../validators/chat.schema';

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { query } = getConversationByOrderSchema.parse({ query: req.query });
  
  const messages = await ChatService.getOrderMessages(query.order_id, profile_id);
  sendSuccess(res, 'Messages retrieved', messages);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { query } = getConversationByOrderSchema.parse({ query: req.query });
  const { body } = createMessageSchema.parse({ body: req.body });
  
  const message = await ChatService.sendOrderMessage(query.order_id, profile_id, body.message, body.media_url);
  sendSuccess(res, 'Message sent', message, 201);
});

export const sendSupportMessage = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { body } = supportConversationSchema.parse({ body: req.body });
  
  const message = await ChatService.sendSupportMessage(body.receiver_id, profile_id, body.message, body.media_url);
  sendSuccess(res, 'Support message sent', message, 201);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { params } = threadIdSchema.parse({ params: req.params });
  
  await ChatService.markMessagesAsRead(params.threadId, profile_id);
  sendSuccess(res, 'Messages marked as read', {});
});

export const sendTyping = asyncHandler(async (req: Request, res: Response) => {
  const profile_id = req.user!.id;
  const { params } = threadIdSchema.parse({ params: req.params });
  const { body } = typingIndicatorSchema.parse({ body: req.body });

  await ChatService.sendTypingIndicator(params.threadId, profile_id, body.is_typing);
  sendSuccess(res, 'Typing indicator sent', {});
});

/**
 * Kitchen-centric chat — replaces apps/mobile's direct Supabase chat_threads/
 * chat_messages reads/writes. Unlike getMessages/sendMessage above, these
 * don't require an order_id (a consumer can message a kitchen directly from
 * its profile page, not only from an existing order).
 */
export const getOrCreateThread = asyncHandler(async (req: Request, res: Response) => {
  const { body } = getOrCreateThreadSchema.parse({ body: req.body });
  const thread = await ChatService.getOrCreateKitchenThread(req.user!.id, body.kitchen_id);
  sendSuccess(res, 'Thread ready', thread);
});

export const getMyThreads = asyncHandler(async (req: Request, res: Response) => {
  const threads = await ChatService.getThreadsForUser(req.user!.id, req.user!.role);
  sendSuccess(res, 'Threads retrieved', threads);
});

export const getThreadMessages = asyncHandler(async (req: Request, res: Response) => {
  const { params } = threadIdSchema.parse({ params: req.params });
  const messages = await ChatService.getThreadMessages(params.threadId, req.user!.id);
  sendSuccess(res, 'Messages retrieved', messages);
});

export const sendThreadMessage = asyncHandler(async (req: Request, res: Response) => {
  const { params } = threadIdSchema.parse({ params: req.params });
  const { body } = createMessageSchema.parse({ body: req.body });
  const message = await ChatService.sendThreadMessage(params.threadId, req.user!.id, body.message, body.media_url);
  sendSuccess(res, 'Message sent', message, 201);
});
