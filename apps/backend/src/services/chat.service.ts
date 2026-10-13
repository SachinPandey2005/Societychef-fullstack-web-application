import { ChatRepository } from '../repositories/chat.repository';
import { OrderService } from './order.service';
import { KitchenService } from './kitchen.service';
import { RealtimeService } from './realtime.service';
import { AuthorizationError, NotFoundError } from '../utils/errors';
import { NotificationService } from './notification.service';

export class ChatService {
  static async sendOrderMessage(order_id: string, sender_id: string, body: string, media_url?: string) {
    const order = await OrderService.getOrderById(order_id);
    const kitchen = await KitchenService.getKitchenById(order.kitchen_id);
    
    // Verify Sender is part of the order
    if (sender_id !== order.profile_id && sender_id !== kitchen.chef_user_id) {
      throw new AuthorizationError('You are not authorized to send messages for this order');
    }

    const conversation = await ChatRepository.findOrCreateOrderConversation(order_id, order.profile_id, kitchen.id);
    
    const msg = await ChatRepository.createMessage({
      thread_id: conversation.id,
      sender_id,
      body,
      media_url
    });

    // Broadcast Realtime Update
    await RealtimeService.broadcastEvent(`chat:${conversation.id}`, 'NEW_MESSAGE', msg);

    // Push notification to the other participant
    const receiver_id = sender_id === order.profile_id ? kitchen.chef_user_id : order.profile_id;
    await NotificationService.sendNotification({
      profile_id: receiver_id,
      title: sender_id === order.profile_id ? 'New message from consumer' : 'New message from chef',
      message: body,
      type: 'CHAT_MESSAGE',
      entity_type: 'chat',
      entity_id: conversation.id
    });

    return msg;
  }

  static async sendSupportMessage(receiver_id: string, sender_id: string, body: string, media_url?: string) {
    const conversation = await ChatRepository.findOrCreateSupportConversation(sender_id, receiver_id);
    
    const msg = await ChatRepository.createMessage({
      thread_id: conversation.id,
      sender_id,
      body,
      media_url
    });

    await RealtimeService.broadcastEvent(`chat:${conversation.id}`, 'NEW_MESSAGE', msg);

    await NotificationService.sendNotification({
      profile_id: receiver_id,
      title: 'New Support Message',
      message: body,
      type: 'CHAT_MESSAGE',
      entity_type: 'chat',
      entity_id: conversation.id
    });

    return msg;
  }

  static async getOrderMessages(order_id: string, requester_id: string) {
    const order = await OrderService.getOrderById(order_id);
    const kitchen = await KitchenService.getKitchenById(order.kitchen_id);
    
    if (requester_id !== order.profile_id && requester_id !== kitchen.chef_user_id) {
      throw new AuthorizationError('You are not authorized to read messages for this order');
    }

    const conversation = await ChatRepository.findOrCreateOrderConversation(order_id, order.profile_id, kitchen.id);
    return ChatRepository.getMessages(conversation.id);
  }

  static async markMessagesAsRead(thread_id: string, requester_id: string) {
    await ChatRepository.markMessagesAsRead(thread_id, requester_id);
    await RealtimeService.broadcastEvent(`chat:${thread_id}`, 'MESSAGES_READ', { read_by: requester_id });
  }

  static async sendTypingIndicator(thread_id: string, sender_id: string, is_typing: boolean) {
    await RealtimeService.broadcastEvent(`chat:${thread_id}`, 'TYPING_INDICATOR', { sender_id, is_typing });
  }

  /** Kitchen-centric chat — see ChatRepository.findOrCreateThread. */
  static async getOrCreateKitchenThread(consumer_id: string, kitchen_id: string) {
    const thread = await ChatRepository.findOrCreateThread(consumer_id, kitchen_id);
    const kitchen = await KitchenService.getKitchenById(kitchen_id);
    return { ...thread, kitchen_name: kitchen?.name || 'Chef Kitchen' };
  }

  static async getThreadsForUser(profile_id: string, role: string) {
    if (role === 'chef') {
      const { KitchenRepository } = require('../repositories/kitchen.repository');
      const kitchen = await KitchenRepository.findByChefUserId(profile_id);
      if (!kitchen) return [];
      return ChatRepository.getThreadsForKitchen(kitchen.id);
    }
    return ChatRepository.getThreadsForConsumer(profile_id);
  }

  private static async authorizeThreadAccess(thread_id: string, requester_id: string) {
    const thread = await ChatRepository.getConversationById(thread_id);
    if (!thread) throw new NotFoundError('Conversation not found');
    if (thread.consumer_id === requester_id) return thread;
    const kitchen = thread.kitchen_id ? await KitchenService.getKitchenById(thread.kitchen_id).catch(() => null) : null;
    if (kitchen?.chef_user_id === requester_id) return thread;
    throw new AuthorizationError('You are not authorized to access this conversation');
  }

  static async getThreadMessages(thread_id: string, requester_id: string) {
    await this.authorizeThreadAccess(thread_id, requester_id);
    return ChatRepository.getMessages(thread_id);
  }

  static async sendThreadMessage(thread_id: string, sender_id: string, body: string, media_url?: string) {
    const thread = await this.authorizeThreadAccess(thread_id, sender_id);

    const msg = await ChatRepository.createMessage({ thread_id, sender_id, body, media_url });
    await RealtimeService.broadcastEvent(`chat:${thread_id}`, 'NEW_MESSAGE', msg);

    const kitchen = thread.kitchen_id ? await KitchenService.getKitchenById(thread.kitchen_id).catch(() => null) : null;
    const receiver_id = sender_id === thread.consumer_id ? kitchen?.chef_user_id : thread.consumer_id;
    if (receiver_id) {
      await NotificationService.sendNotification({
        profile_id: receiver_id,
        title: sender_id === thread.consumer_id ? 'New message from consumer' : 'New message from chef',
        message: body,
        type: 'CHAT_MESSAGE',
        entity_type: 'chat',
        entity_id: thread_id,
      });
    }

    return msg;
  }
}
