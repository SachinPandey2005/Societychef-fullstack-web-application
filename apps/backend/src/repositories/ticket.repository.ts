import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { tickets, ticketMessages } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import { Ticket, TicketMessage, TicketStatus } from '../types/ticket';

// tickets.profile_id is the real NOT NULL column, but Ticket's type uses
// customer_id/assigned_to (neither exist — real: profile_id/
// assigned_agent_id). Drizzle silently drops unknown keys on insert, so this
// previously meant profile_id was never set at all — every createTicket call
// violated the NOT NULL constraint. customer_id/assigned_to are kept as the
// external parameter/response names (matching ticket.service.ts/
// ticket.controller.ts, unchanged) and mapped to the real columns here.
function ticketRowToTicket(row: Record<string, any>): Ticket {
  const mapped = rowToSnakeCase<any>(row);
  mapped.customer_id = mapped.profile_id;
  mapped.assigned_to = mapped.assigned_agent_id;
  return mapped as Ticket;
}

export class TicketRepository {
  static async createTicket(payload: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'status'> & { category?: string; order_id?: string }): Promise<Ticket> {
    const rows = await db
      .insert(tickets)
      .values({
        profileId: payload.customer_id,
        subject: payload.subject,
        description: payload.description,
        priority: payload.priority,
        category: payload.category,
        orderId: payload.order_id,
        status: 'OPEN',
      })
      .returning();
    return ticketRowToTicket(rows[0]);
  }

  static async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const rows = await db.update(tickets).set({ status, updatedAt: new Date().toISOString() }).where(eq(tickets.id, id)).returning();
    return ticketRowToTicket(rows[0]);
  }

  static async getTickets(limit: number, offset: number): Promise<Ticket[]> {
    const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt)).limit(limit).offset(offset);
    return rows.map(ticketRowToTicket);
  }

  /** Self-service listing — a regular user's own tickets, not the full admin queue. */
  static async getTicketsForProfile(profileId: string, limit: number, offset: number): Promise<Ticket[]> {
    const rows = await db
      .select()
      .from(tickets)
      .where(eq(tickets.profileId, profileId))
      .orderBy(desc(tickets.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map(ticketRowToTicket);
  }

  static async getTicketById(id: string): Promise<Ticket | null> {
    const rows = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    return rows[0] ? ticketRowToTicket(rows[0]) : null;
  }

  static async getMessages(ticketId: string): Promise<TicketMessage[]> {
    const rows = await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
    return rowsToSnakeCase<TicketMessage>(rows);
  }

  static async addMessage(payload: Omit<TicketMessage, 'id' | 'created_at'>): Promise<TicketMessage> {
    const rows = await db
      .insert(ticketMessages)
      .values({ ticketId: payload.ticket_id, senderId: payload.sender_id, message: payload.message })
      .returning();
    return rowToSnakeCase<TicketMessage>(rows[0]);
  }
}
