import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { CrmService } from '../services/crm.service';
import { z } from 'zod';

// Zod schemas for input validation
const partnerIdParamSchema = z.object({
  id: z.string().uuid(),
});

const assignOrderSchema = z.object({
  order_id: z.string().uuid(),
});

const updateKycReasonSchema = z.object({
  reason: z.string().optional(),
  flaggedDocs: z.array(z.string()).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  preferred_language: z.string().optional(),
  vehicle_type: z.string().optional(),
  permanent_address: z.string().optional(),
  current_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export const getPartnerProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = partnerIdParamSchema.parse(req.params);

  // Fetch from delivery_partners checking both id and user_id
  let { data: partner } = await supabase
    .from('delivery_partners')
    .select(`
      *,
      profiles (
        name,
        email,
        phone
      )
    `)
    .or(`id.eq.${id},user_id.eq.${id}`)
    .maybeSingle();

  if (!partner) {
    return res.status(404).json({ success: false, message: 'Delivery partner not found' });
  }

  // Ensure profiles details fallback if missing
  if (!partner.profiles && partner.user_id) {
    const { data: prof } = await supabase.from('profiles').select('name, email, phone').eq('id', partner.user_id).maybeSingle();
    if (prof) partner.profiles = prof;
  }

  const pId = partner.id;
  const uId = partner.user_id;

  // Fetch optional associated details using dual ID match
  const [vehicle, bank, emergency, assignment, metrics, documents] = await Promise.all([
    supabase.from('partner_vehicles').select('*').or(`partner_id.eq.${pId},partner_id.eq.${uId}`).maybeSingle(),
    supabase.from('partner_bank_accounts').select('*').or(`partner_id.eq.${pId},partner_id.eq.${uId}`).maybeSingle(),
    supabase.from('partner_emergency_contacts').select('*').or(`partner_id.eq.${pId},partner_id.eq.${uId}`).maybeSingle(),
    supabase.from('partner_society_assignments').select('*, societies(name)').or(`partner_id.eq.${pId},partner_id.eq.${uId}`).maybeSingle(),
    supabase.from('delivery_partner_metrics').select('*').or(`partner_id.eq.${pId},partner_id.eq.${uId}`).maybeSingle(),
    supabase.from('partner_documents').select('*').or(`partner_id.eq.${pId},partner_id.eq.${uId}`).order('created_at', { ascending: false }),
  ]);

  sendSuccess(res, 'Delivery partner profile retrieved', {
    ...partner,
    vehicle: vehicle.data || null,
    bank: bank.data || null,
    emergency: emergency.data || null,
    assignment: assignment.data || null,
    metrics: metrics.data || null,
    documents: documents.data || [],
  });
});

export const getPartnerOrders = asyncHandler(async (req: Request, res: Response) => {
  const { id } = partnerIdParamSchema.parse(req.params);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, kitchens(name, address)')
    .eq('delivery_partner_id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  sendSuccess(res, 'Orders retrieved', orders);
});

export const getPartnerEarnings = asyncHandler(async (req: Request, res: Response) => {
  const { id } = partnerIdParamSchema.parse(req.params);

  // Get partner's user_id from delivery_partners
  const { data: partner } = await supabase.from('delivery_partners').select('user_id').eq('id', id).single();
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

  // Get partner's wallet
  const { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', partner.user_id).eq('role', 'DELIVERY_PARTNER').single();
  if (!wallet) return sendSuccess(res, 'No wallet active', { total: 0, transactions: [] });

  // Fetch all transactions
  const { data: txs, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Calculate earnings summaries
  const total = txs.reduce((sum, tx) => sum + (tx.type === 'CREDIT' ? Number(tx.amount) : -Number(tx.amount)), 0);

  sendSuccess(res, 'Earnings summary retrieved', {
    total,
    transactions: txs,
  });
});

export const getPartnerWallet = asyncHandler(async (req: Request, res: Response) => {
  const { id } = partnerIdParamSchema.parse(req.params);

  const { data: partner } = await supabase.from('delivery_partners').select('user_id').eq('id', id).single();
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', partner.user_id).eq('role', 'DELIVERY_PARTNER').maybeSingle();
  if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false });

  sendSuccess(res, 'Wallet retrieved', { wallet, transactions });
});

export const getPartnerSettlements = asyncHandler(async (req: Request, res: Response) => {
  const { id } = partnerIdParamSchema.parse(req.params);

  const { data: settlements, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('held_transaction_id', id) // Wait, settlements references user/wallet or transaction? Let's query settlements for partner
    .order('created_at', { ascending: false });

  if (error) throw error;
  sendSuccess(res, 'Settlements retrieved', settlements);
});

export const getPartnerNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { id } = partnerIdParamSchema.parse(req.params);

  const { data: partner } = await supabase.from('delivery_partners').select('user_id').eq('id', id).single();
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', partner.user_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  sendSuccess(res, 'Notifications retrieved', notifications);
});

export const getPartnerDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = partnerIdParamSchema.parse(req.params);

  let pId = id;
  let uId = id;

  const { data: partner } = await supabase
    .from('delivery_partners')
    .select('id, user_id')
    .or(`id.eq.${id},user_id.eq.${id}`)
    .maybeSingle();

  if (partner) {
    pId = partner.id;
    uId = partner.user_id;
  }

  const { data: documents, error } = await supabase
    .from('partner_documents')
    .select('*')
    .or(`partner_id.eq.${pId},partner_id.eq.${uId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  sendSuccess(res, 'Documents retrieved', documents || []);
});

export const assignOrder = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { id } = partnerIdParamSchema.parse(req.params);
  const { order_id } = assignOrderSchema.parse(req.body);

  // Assign order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .update({ delivery_partner_id: id, status: 'ASSIGNED', updated_at: new Date().toISOString() })
    .eq('id', order_id)
    .select()
    .single();

  if (orderErr) throw orderErr;

  // Set partner to BUSY
  await supabase.from('delivery_partners').update({ status: 'BUSY' }).eq('id', id);

  await CrmService.logAction(admin_id, 'ASSIGN_ORDER', 'order', order_id, `Assigned to partner ${id}`);

  sendSuccess(res, 'Order assigned successfully', order);
});

export const approveKyc = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { id } = partnerIdParamSchema.parse(req.params);

  const updated = await CrmService.updatePartnerKycStatus(admin_id, id, 'APPROVED', 'All KYC documents verified successfully');
  sendSuccess(res, 'KYC approved successfully', updated);
});

export const rejectKyc = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { id } = partnerIdParamSchema.parse(req.params);
  const { reason, flaggedDocs } = updateKycReasonSchema.parse(req.body);

  const noteObj = {
    notes: reason || 'Documents verification rejected',
    flaggedDocs: flaggedDocs || []
  };

  const updated = await CrmService.updatePartnerKycStatus(admin_id, id, 'REJECTED', JSON.stringify(noteObj));
  sendSuccess(res, 'KYC rejected successfully', updated);
});

export const suspendPartner = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { id } = partnerIdParamSchema.parse(req.params);

  const updated = await CrmService.updatePartnerStatus(admin_id, id, 'SUSPENDED', 'Partner suspended by administrator');
  sendSuccess(res, 'Partner suspended successfully', updated);
});

export const activatePartner = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { id } = partnerIdParamSchema.parse(req.params);

  const updated = await CrmService.updatePartnerStatus(admin_id, id, 'ACTIVE', 'Partner activated by administrator');
  sendSuccess(res, 'Partner activated successfully', updated);
});

export const updatePartner = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { id } = partnerIdParamSchema.parse(req.params);
  const fields = updateProfileSchema.parse(req.body);

  // Separate profiles fields from delivery_partners fields
  const dpFields: any = {};
  if (fields.preferred_language) dpFields.preferred_language = fields.preferred_language;
  if (fields.vehicle_type) dpFields.vehicle_type = fields.vehicle_type;
  if (fields.permanent_address) dpFields.permanent_address = fields.permanent_address;
  if (fields.current_address) dpFields.current_address = fields.current_address;
  if (fields.city) dpFields.city = fields.city;
  if (fields.state) dpFields.state = fields.state;
  if (fields.pincode) dpFields.pincode = fields.pincode;

  const { data: partner } = await supabase.from('delivery_partners').select('user_id').eq('id', id).single();
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

  // Update delivery_partners
  if (Object.keys(dpFields).length > 0) {
    const { error: dpErr } = await supabase.from('delivery_partners').update(dpFields).eq('id', id);
    if (dpErr) throw dpErr;
  }

  // Update profiles table if name/phone is provided
  const profileFields: any = {};
  if (fields.name) profileFields.name = fields.name;
  if (fields.phone) profileFields.phone = fields.phone;

  if (Object.keys(profileFields).length > 0) {
    const { error: profErr } = await supabase.from('profiles').update(profileFields).eq('id', partner.user_id);
    if (profErr) throw profErr;
  }

  await CrmService.logAction(admin_id, 'UPDATE_PARTNER_PROFILE', 'delivery_partner', id, 'Profile details modified', null, fields);

  sendSuccess(res, 'Delivery partner updated successfully', { id });
});

export const deletePartner = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { id } = partnerIdParamSchema.parse(req.params);

  // Soft delete: set status to SUSPENDED/DELETED
  const { data: partner, error } = await supabase
    .from('delivery_partners')
    .update({ status: 'SUSPENDED', kyc_status: 'REJECTED', rejection_reason: 'Partner account deleted by admin' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await CrmService.logAction(admin_id, 'DELETE_PARTNER', 'delivery_partner', id, 'Partner account deleted/deactivated');

  sendSuccess(res, 'Partner deactivated/deleted successfully', partner);
});
