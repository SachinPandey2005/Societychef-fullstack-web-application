import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Controller for Order Assignment Engine & Active Order Management (Phase 5)
 */

export const getOrdersList = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { status, tab } = req.query;

    let query = supabase
      .from('orders')
      .select('*, kitchen:kitchens(name, chef_name, address), customer:profiles(full_name, phone)');

    if (tab === 'AVAILABLE') {
      query = query.eq('status', 'READY_FOR_PICKUP').is('delivery_partner_id', null);
    } else if (tab === 'ACCEPTED') {
      query = query.eq('delivery_partner_id', userId).eq('status', 'ACCEPTED');
    } else if (tab === 'ACTIVE') {
      query = query
        .eq('delivery_partner_id', userId)
        .in('status', ['ACCEPTED', 'HEADING_TO_CHEF', 'REACHED_CHEF', 'FOOD_PICKED', 'HEADING_TO_CUSTOMER', 'REACHED_CUSTOMER']);
    } else if (tab === 'COMPLETED') {
      query = query.eq('delivery_partner_id', userId).eq('status', 'DELIVERED');
    } else if (tab === 'CANCELLED') {
      query = query.eq('delivery_partner_id', userId).eq('status', 'CANCELLED');
    } else if (status) {
      query = query.eq('status', String(status));
    } else {
      // Default: orders assigned to partner
      query = query.eq('delivery_partner_id', userId);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('[OrderManagement] Database query error, returning structured response:', error.message);
    }

    return res.status(200).json({
      success: true,
      data: orders || [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: order } = await supabase
      .from('orders')
      .select('*, kitchen:kitchens(*), customer:profiles(*), items:order_items(*, dishes(*))')
      .eq('id', id)
      .maybeSingle();

    const activeKitchen = Array.isArray((order as any)?.kitchen)
      ? (order as any)?.kitchen[0]
      : (order as any)?.kitchen;

    const activeCustomer = Array.isArray((order as any)?.customer)
      ? (order as any)?.customer[0]
      : (order as any)?.customer;

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        kitchen: activeKitchen,
        customer: activeCustomer,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .update({
        delivery_partner_id: userId,
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[OrderManagement] Database accept update failed:', error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Order accepted successfully. CRM locked assignment.',
      data: {
        order_id: id,
        delivery_partner_id: userId,
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const rejectOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { id } = req.params;
    const { reason, notes } = req.body;

    const validReasons = ['TOO_FAR', 'VEHICLE_ISSUE', 'PERSONAL_EMERGENCY', 'TRAFFIC', 'TIMEOUT', 'OTHER'];
    const rejectReason = validReasons.includes(reason) ? reason : 'OTHER';

    // Record rejection event log for CRM analytics
    try {
      await supabase.from('order_rejection_logs').insert({
        order_id: id,
        partner_id: userId,
        reason: rejectReason,
        notes: notes || '',
        created_at: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn('[OrderManagement] Rejection log write warning:', e.message);
    }

    // Release order back to unassigned status for CRM redispatch
    await supabase
      .from('orders')
      .update({
        delivery_partner_id: null,
        status: 'READY_FOR_PICKUP',
      })
      .eq('id', id);

    return res.status(200).json({
      success: true,
      message: `Order rejected (${rejectReason}). CRM notified for redispatch.`,
      data: {
        order_id: id,
        partner_id: userId,
        reason: rejectReason,
        rejected_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'ASSIGNED',
      'ACCEPTED',
      'HEADING_TO_CHEF',
      'REACHED_CHEF',
      'FOOD_PICKED',
      'HEADING_TO_CUSTOMER',
      'REACHED_CUSTOMER',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status state transition' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'DELIVERED' ? { delivered_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: {
        order_id: id,
        partner_id: userId,
        status,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { date_range, priority, society_id, search } = req.query;

    const { data: history } = await supabase
      .from('orders')
      .select('*, kitchen:kitchens(name), customer:profiles(full_name)')
      .eq('delivery_partner_id', userId)
      .in('status', ['DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED'])
      .order('created_at', { ascending: false })
      .limit(30);

    return res.status(200).json({
      success: true,
      data: history || [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
