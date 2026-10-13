import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { CrmService } from '../services/crm.service';
import { sendSuccess } from '../utils/response';
import { searchSchema, createAdminNoteSchema, updateCustomerStatusSchema, updatePartnerStatusSchema, assignPartnerSocietySchema, updatePartnerKycSchema } from '../validators/crm.schema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { profiles } from '../db/schema';

export const searchCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  const customers = await CrmService.searchCustomers(query.query || '', query.page, query.limit);
  sendSuccess(res, 'Customers retrieved', customers);
});

export const searchChefs = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  const chefs = await CrmService.searchChefs(query.query || '', query.page, query.limit);
  sendSuccess(res, 'Chefs retrieved', chefs);
});

export const searchSocieties = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  const societies = await CrmService.searchSocieties(query.query || '', query.page, query.limit);
  sendSuccess(res, 'Societies retrieved', societies);
});

export const searchDeliveryPartners = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  const partners = await CrmService.searchDeliveryPartners(query.query || '', query.page, query.limit, query.status);
  sendSuccess(res, 'Delivery partners retrieved', partners);
});

export const updateCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updateCustomerStatusSchema.parse({ params: req.params, body: req.body });
  
  const updated = await CrmService.updateCustomerStatus(admin_id, params.id, body.status, body.reason);
  sendSuccess(res, `Customer status updated to ${body.status}`, updated);
});

export const updateChefStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updateCustomerStatusSchema.parse({ params: req.params, body: req.body }); // Reusing same schema
  
  const updated = await CrmService.updateChefStatus(admin_id, params.id, body.status, body.reason);
  sendSuccess(res, `Chef status updated to ${body.status}`, updated);
});

export const addAdminNote = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { body } = createAdminNoteSchema.parse({ body: req.body });
  
  const note = await CrmService.addAdminNote(admin_id, body.entity_type, body.entity_id, body.note);
  sendSuccess(res, 'Admin note added', note, 201);
});

export const searchOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await CrmService.searchOrders(req.query);
  sendSuccess(res, 'Orders retrieved', orders);
});

export const getOrderFinancialDetails = asyncHandler(async (req: Request, res: Response) => {
  const { OrderService } = require('../services/order.service');
  const details = await OrderService.getOrderFinancialSummary(req.params.id);
  sendSuccess(res, 'Financial details retrieved', details);
});

export const updateOrderPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { OrderService } = require('../services/order.service');
  const { payment_status } = req.body;
  const updated = await OrderService.updatePaymentStatus(req.params.id, payment_status, admin_id);
  sendSuccess(res, 'Order payment status updated', updated);
});

export const updateOrderSettlementStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { OrderService } = require('../services/order.service');
  const { settlement_status } = req.body;
  const updated = await OrderService.updateSettlementStatus(req.params.id, settlement_status, admin_id);
  sendSuccess(res, 'Order settlement status updated', updated);
});

export const forceUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { id } = z.object({ id: z.string() }).parse(req.params);
  // Use orderStatusTransitionSchema but allow reason
  const { status, reason } = req.body;
  if (!status || !reason) return res.status(400).json({ success: false, message: 'Status and reason are required' });
  
  const updated = await CrmService.forceUpdateOrderStatus(admin_id, id, status as string, reason as string);
  sendSuccess(res, `Order status forcefully updated to ${status}`, updated);
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  // searchSchema has query, page, limit. We can use 'query' as entity_type filter.
  const logs = await CrmService.getAuditLogs(query.query, query.page, query.limit);
  sendSuccess(res, 'Audit logs retrieved', logs);
});

export const updatePartnerStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updatePartnerStatusSchema.parse({ params: req.params, body: req.body });
  
  const updated = await CrmService.updatePartnerStatus(admin_id, params.id, body.status, body.reason);
  sendSuccess(res, `Delivery partner status updated to ${body.status}`, updated);
});

export const assignPartnerSociety = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = assignPartnerSocietySchema.parse({ params: req.params, body: req.body });
  
  const assigned = await CrmService.assignPartnerSociety(admin_id, params.id, body);
  sendSuccess(res, 'Delivery partner society boundaries updated', assigned);
});

export const updatePartnerKycStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updatePartnerKycSchema.parse({ params: req.params, body: req.body });
  
  const updated = await CrmService.updatePartnerKycStatus(admin_id, params.id, body.kyc_status, body.notes);
  sendSuccess(res, `Delivery partner KYC status updated to ${body.kyc_status}`, updated);
});

export const getChefProfile = asyncHandler(async (req: Request, res: Response) => {
  const chef = await CrmService.getChefProfile(req.params.id as string);
  sendSuccess(res, 'Chef profile details retrieved', chef);
});

export const getCustomerProfile = asyncHandler(async (req: Request, res: Response) => {
  const customer = await CrmService.getCustomerProfile(req.params.id as string);
  sendSuccess(res, 'Customer profile details retrieved', customer);
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const id = req.params.id as string;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  // Previously delegated to supabase.auth.admin.updateUserById, which
  // depended on Supabase Auth owning the password. Admin accounts now own
  // their own password hash directly on profiles (see
  // supabase/local/022_profile_password_hash.sql and
  // AuthService.adminLogin).
  const passwordHash = await bcrypt.hash(password, 10);
  await db.update(profiles).set({ passwordHash }).where(eq(profiles.id, id));

  await CrmService.logAction(admin_id, 'RESET_PASSWORD', 'profile', id, 'Admin action reset password');
  sendSuccess(res, 'Password reset successfully');
});

export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { profile_id, title, message, type } = req.body;
  if (!profile_id || !title || !message) {
    return res.status(400).json({ success: false, message: 'profile_id, title, and message are required' });
  }

  const { NotificationService } = require('../services/notification.service');
  await NotificationService.sendNotification({
    profile_id: profile_id as string,
    title,
    message,
    type: type || 'CHEF_ALERT',
  });

  await CrmService.logAction(admin_id, 'SEND_NOTIFICATION', 'profile', profile_id as string, `Sent notification: ${title}`);
  sendSuccess(res, 'Notification queued successfully');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const id = req.params.id as string;
  const updates = req.body;

  const { supabase } = require('../config/supabase');
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await CrmService.logAction(admin_id, 'UPDATE_PROFILE', 'profile', id, 'Admin action update profile', null, updates);
  sendSuccess(res, 'Profile updated successfully', updatedProfile);
});

export const updateKitchen = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const id = req.params.id as string;
  const updates = req.body;

  const { supabase } = require('../config/supabase');
  const { data: updatedKitchen, error } = await supabase
    .from('kitchens')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await CrmService.logAction(admin_id, 'UPDATE_KITCHEN', 'kitchen', id, 'Admin action update kitchen profile', null, updates);
  sendSuccess(res, 'Kitchen updated successfully', updatedKitchen);
});
