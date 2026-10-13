import { and, asc, desc, eq, ne } from 'drizzle-orm';
import { db } from '../db/client';
import { chatThreads, chatMessages, kitchens, profiles } from '../db/schema';
import { rowToSnakeCase } from '../db/caseMapper';
import { Conversation, CreateMessageInput, Message } from '../types/chat';

/**
 * The real chat_threads table only has (consumer_id, kitchen_id, created_at)
 * — no order_id, thread_type, or participant_1_id/participant_2_id, all of
 * which this file previously assumed. Against the real Supabase database
 * every one of these queries would have failed with "column does not exist".
 *
 * findOrCreateOrderConversation is fixed below: an order's chat is really
 * just "the consumer-kitchen thread" (order_id/thread_type never persisted
 * anything real), which also matches how the mobile app's own chat already
 * works — one thread per consumer-kitchen pair, not per order.
 *
 * findOrCreateSupportConversation has NO real equivalent: there is no table
 * support for a generic two-arbitrary-participants thread at all. Left
 * unconverted (still broken, same as before — not a regression) rather than
 * invent a schema for it unprompted; it needs a product/schema decision
 * (e.g. a participant_1_id/participant_2_id migration) before it can work.
 */

/**
 * Postgres (via the driver, with Drizzle's timestamp mode: 'string') returns
 * "2026-10-06 14:23:11.123+00" — space-separated, no colon in the zone
 * offset. Node/V8 parses that fine, but Hermes (React Native's JS engine on
 * Android) does not: `new Date(...)` silently produces an Invalid Date,
 * which every chat bubble/thread preview then rendered as the literal text
 * "Invalid Date". Normalizing to real ISO-8601 here is what mobile needs.
 */
function toIsoCreatedAt(mapped: Record<string, any>): void {
  if (mapped.created_at) {
    const d = new Date(mapped.created_at);
    if (!isNaN(d.getTime())) mapped.created_at = d.toISOString();
  }
}

function threadRowToConversation(row: Record<string, any>): Conversation {
  const mapped = rowToSnakeCase<any>(row);
  mapped.thread_type = 'ORDER';
  toIsoCreatedAt(mapped);
  return mapped as Conversation;
}

function toIsoMessage(row: Record<string, any>): Message {
  const mapped = rowToSnakeCase<any>(row);
  toIsoCreatedAt(mapped);
  return mapped as Message;
}

export class ChatRepository {
  static async findOrCreateOrderConversation(order_id: string, consumer_id: string, kitchen_id: string): Promise<Conversation> {
    const existing = await db
      .select()
      .from(chatThreads)
      .where(and(eq(chatThreads.consumerId, consumer_id), eq(chatThreads.kitchenId, kitchen_id)))
      .limit(1);

    if (existing[0]) return threadRowToConversation(existing[0]);

    const created = await db.insert(chatThreads).values({ consumerId: consumer_id, kitchenId: kitchen_id }).returning();
    return threadRowToConversation(created[0]);
  }

  static async findOrCreateSupportConversation(participant_1_id: string, participant_2_id: string): Promise<Conversation> {
    throw new Error(
      'Support chat has no backing schema (chat_threads has no participant columns) — needs a schema decision before this can work, see chat.repository.ts.'
    );
  }

  static async getConversationById(id: string): Promise<Conversation | null> {
    const rows = await db.select().from(chatThreads).where(eq(chatThreads.id, id)).limit(1);
    return rows[0] ? threadRowToConversation(rows[0]) : null;
  }

  static async createMessage(payload: CreateMessageInput): Promise<Message> {
    const rows = await db
      .insert(chatMessages)
      .values({
        threadId: payload.thread_id,
        senderId: payload.sender_id,
        body: payload.body,
        mediaUrl: payload.media_url,
        isRead: false,
        status: 'SENT',
      })
      .returning();
    return toIsoMessage(rows[0]);
  }

  static async getMessages(thread_id: string): Promise<Message[]> {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.threadId, thread_id))
      .orderBy(asc(chatMessages.createdAt));
    return rows.map(toIsoMessage);
  }

  static async markMessagesAsRead(thread_id: string, receiver_id: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true, status: 'READ' })
      .where(
        and(
          eq(chatMessages.threadId, thread_id),
          ne(chatMessages.senderId, receiver_id),
          eq(chatMessages.isRead, false)
        )
      );
  }

  /**
   * The consumer-facing chat flow doesn't always have an order_id on hand
   * when starting a conversation (e.g. messaging a kitchen from its profile
   * page) — this is the same underlying thread as
   * findOrCreateOrderConversation (one thread per consumer-kitchen pair),
   * just without the unused order_id parameter.
   */
  static async findOrCreateThread(consumer_id: string, kitchen_id: string): Promise<Conversation> {
    const existing = await db
      .select()
      .from(chatThreads)
      .where(and(eq(chatThreads.consumerId, consumer_id), eq(chatThreads.kitchenId, kitchen_id)))
      .limit(1);
    if (existing[0]) return threadRowToConversation(existing[0]);

    const created = await db.insert(chatThreads).values({ consumerId: consumer_id, kitchenId: kitchen_id }).returning();
    return threadRowToConversation(created[0]);
  }

  static async getThreadsForConsumer(consumer_id: string): Promise<any[]> {
    const rows = await db
      .select({ thread: chatThreads, kitchenName: kitchens.name })
      .from(chatThreads)
      .leftJoin(kitchens, eq(chatThreads.kitchenId, kitchens.id))
      .where(eq(chatThreads.consumerId, consumer_id))
      .orderBy(desc(chatThreads.createdAt));

    return rows.map((r) => ({
      ...threadRowToConversation(r.thread),
      kitchen_name: r.kitchenName,
    }));
  }

  static async getThreadsForKitchen(kitchen_id: string): Promise<any[]> {
    const rows = await db
      .select({ thread: chatThreads, consumerName: profiles.name, consumerDisplayName: profiles.displayName })
      .from(chatThreads)
      .leftJoin(profiles, eq(chatThreads.consumerId, profiles.id))
      .where(eq(chatThreads.kitchenId, kitchen_id))
      .orderBy(desc(chatThreads.createdAt));

    return rows.map((r) => ({
      ...threadRowToConversation(r.thread),
      consumer_name: r.consumerName || r.consumerDisplayName,
    }));
  }
}
