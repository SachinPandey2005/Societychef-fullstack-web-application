import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { TicketService } from '../services/ticket.service';
import { sendSuccess } from '../utils/response';
import { searchSchema } from '../validators/crm.schema';
import { createTicketSchema, updateTicketStatusSchema, addTicketMessageSchema, createMyTicketSchema } from '../validators/ticket.schema';
import { z } from 'zod';

export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  const tickets = await TicketService.getTickets(query.page, query.limit);
  sendSuccess(res, 'Tickets retrieved', tickets);
});

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createTicketSchema.parse({ body: req.body });
  const ticket = await TicketService.createTicket(body.customer_id, body.subject, body.description, body.priority);
  sendSuccess(res, 'Ticket created', ticket, 201);
});

export const updateTicketStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updateTicketStatusSchema.parse({ params: req.params, body: req.body });
  
  const ticket = await TicketService.updateStatus(admin_id, params.id, body.status);
  sendSuccess(res, `Ticket status updated to ${body.status}`, ticket);
});

export const addTicketMessage = asyncHandler(async (req: Request, res: Response) => {
  const sender_id = req.user!.id;
  const { params, body } = addTicketMessageSchema.parse({ params: req.params, body: req.body });

  const message = await TicketService.addMessage(sender_id, params.id, body.message);
  sendSuccess(res, 'Message added', message, 201);
});

// ── Self-service endpoints (any authenticated consumer/chef, not just admins) ──

export const getMyTickets = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  const tickets = await TicketService.getMyTickets(req.user!.id, query.page, query.limit);
  sendSuccess(res, 'Your tickets retrieved', tickets);
});

export const createMyTicket = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createMyTicketSchema.parse({ body: req.body });
  const ticket = await TicketService.createMyTicket(req.user!.id, body);
  sendSuccess(res, 'Ticket created', ticket, 201);
});

export const getMyTicketMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const messages = await TicketService.getMessages(id, req.user!.id);
  sendSuccess(res, 'Ticket messages retrieved', messages);
});

export const addMyTicketMessage = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = addTicketMessageSchema.parse({ params: req.params, body: req.body });
  const message = await TicketService.addMyMessage(params.id, req.user!.id, body.message);
  sendSuccess(res, 'Message added', message, 201);
});
