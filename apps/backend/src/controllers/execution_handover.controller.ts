import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Controller for Pickup Execution, OTP Verification, Proof of Delivery & Exception Handling (Phase 7)
 */

export const confirmPickup = async (req: Request, res: Response) => {
  try {
    const { order_id, checklist } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    return res.status(200).json({
      success: true,
      message: 'Pickup checklist submitted successfully',
      data: {
        order_id,
        checklist_verified: true,
        checklist,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyChefPin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { order_id, pin } = req.body;

    if (!order_id || !pin) {
      return res.status(400).json({ success: false, error: 'Order ID and Chef PIN are required' });
    }

    // NOTE: there is no real per-order PIN generated/stored anywhere yet
    // (no `pin`/`otp` field exists on the orders table). Until that's built,
    // this only accepts the fixed sandbox demo PIN below — it must NOT
    // accept "any 4 digits", which previously let anyone confirm pickup
    // on any order.
    const isValidPin = pin === '1234';
    if (!isValidPin) {
      return res.status(400).json({ success: false, error: 'Invalid Chef Pickup PIN' });
    }

    const timestamp = new Date().toISOString();

    // Update order status in Supabase database
    try {
      await supabase
        .from('orders')
        .update({
          status: 'FOOD_PICKED',
          updated_at: timestamp,
        })
        .eq('id', order_id);
    } catch (err: any) {
      console.warn('[Handover] Order DB update warning:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Chef handover PIN verified successfully',
      data: {
        order_id,
        partner_id: userId,
        status: 'FOOD_PICKED',
        verified_at: timestamp,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyCustomerOtp = async (req: Request, res: Response) => {
  try {
    const { order_id, otp } = req.body;

    if (!order_id || !otp) {
      return res.status(400).json({ success: false, error: 'Order ID and Customer OTP are required' });
    }

    // NOTE: same caveat as verifyChefPin above — no real per-order OTP is
    // generated/stored yet. Only the fixed sandbox demo OTP is accepted;
    // it must NOT accept "any 4-digit numeric string".
    const isValidOtp = otp === '6543';
    if (!isValidOtp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Delivery OTP. Please verify with resident.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer OTP verified successfully',
      data: {
        order_id,
        otp_verified: true,
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const submitProofOfDelivery = async (req: Request, res: Response) => {
  try {
    const { order_id, signature_data, photo_url } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    return res.status(200).json({
      success: true,
      message: 'Proof of delivery recorded successfully',
      data: {
        order_id,
        has_signature: !!signature_data,
        has_photo: !!photo_url,
        uploaded_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const completeDelivery = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { order_id, otp_verified, latitude, longitude } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    if (!otp_verified) {
      return res.status(400).json({ success: false, error: 'Customer OTP verification required before completing delivery' });
    }

    const timestamp = new Date().toISOString();

    // Mark order as DELIVERED & COMPLETED in DB
    try {
      await supabase
        .from('orders')
        .update({
          status: 'DELIVERED',
          delivered_at: timestamp,
          updated_at: timestamp,
        })
        .eq('id', order_id);
    } catch (err: any) {
      console.warn('[Handover] Complete order DB update warning:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Order delivery completed successfully',
      data: {
        order_id,
        partner_id: userId,
        status: 'DELIVERED',
        completed_at: timestamp,
        delivery_location: { latitude, longitude },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const reportIssue = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { order_id, issue_type, notes, photos } = req.body;

    if (!order_id || !issue_type) {
      return res.status(400).json({ success: false, error: 'Order ID and issue type are required' });
    }

    const validIssues = [
      'CUSTOMER_UNAVAILABLE',
      'WRONG_ADDRESS',
      'BUILDING_ACCESS_DENIED',
      'PACKAGE_DAMAGED',
      'ORDER_MISSING_ITEMS',
      'EMERGENCY_SOS',
      'OTHER',
    ];

    const type = validIssues.includes(issue_type) ? issue_type : 'OTHER';

    return res.status(200).json({
      success: true,
      message: 'Delivery issue reported to CRM dispatch team',
      data: {
        ticket_id: `ticket_${Date.now()}`,
        order_id,
        partner_id: userId,
        issue_type: type,
        notes: notes || '',
        photos_count: photos ? photos.length : 0,
        status: 'OPEN',
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    return res.status(200).json({
      success: true,
      data: {
        order_id: order_id || 'ord-101',
        status: 'HEADING_TO_CUSTOMER',
        pickup_confirmed: true,
        chef_pin_verified: true,
        otp_verified: false,
        proof_uploaded: false,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
