import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Controller for Partner Support, Chat, Incident Reporting, and FAQs (Phase 10)
 */

export const getTickets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user' });
    }

    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: tickets || [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { category, priority, description, orderId } = req.body;

    if (!category || !description) {
      return res.status(400).json({ success: false, error: 'Category and description are required' });
    }

    // Insert support ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        profile_id: userId,
        subject: `Support: ${category.replace('_', ' ')}`,
        description,
        category,
        priority: priority || 'MEDIUM',
        order_id: orderId || null,
        status: 'OPEN',
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getTicketDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch ticket details
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (ticketErr || !ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Fetch chat history
    const { data: messages, error: msgErr } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;

    return res.status(200).json({
      success: true,
      data: {
        ticket,
        messages: messages || [],
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { ticketId, message, mediaUrl } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({ success: false, error: 'Ticket ID and message body are required' });
    }

    const { data: chatMessage, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: userId,
        message,
        media_url: mediaUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update ticket modified time
    await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return res.status(201).json({
      success: true,
      message: 'Support message sent',
      data: chatMessage,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const reportIncident = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { incidentType, description, evidenceUrl, latitude, longitude, orderId } = req.body;

    if (!incidentType || !description) {
      return res.status(400).json({ success: false, error: 'Incident type and description are required' });
    }

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Delivery partner not found' });
    }

    const { data: incident, error } = await supabase
      .from('partner_incidents')
      .insert({
        partner_id: partner.id,
        incident_type: incidentType,
        description,
        evidence_url: evidenceUrl || null,
        latitude: latitude || null,
        longitude: longitude || null,
        order_id: orderId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Incident reported successfully to Ops CRM control center',
      data: incident,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const triggerEmergencySOS = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { orderId, latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'GPS coordinates (latitude, longitude) are required' });
    }

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    // Insert critical emergency alarm entry
    const { data: alarm, error } = await supabase
      .from('emergency_sos_alarms')
      .insert({
        partner_id: partner.id,
        order_id: orderId || null,
        latitude,
        longitude,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'EMERGENCY SOS ALERT ACTIVATED! Realtime coordinates sent to Ops control center.',
      data: alarm,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getFaqs = async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;

    let query = supabase.from('faq_kb').select('*');
    if (category) {
      query = query.eq('category', category);
    }

    const { data: faqs, error } = await query;
    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: faqs || [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { feedbackType, description } = req.body;

    if (!feedbackType || !description) {
      return res.status(400).json({ success: false, error: 'Feedback type and description are required' });
    }

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const { data: feedback, error } = await supabase
      .from('partner_feedback')
      .insert({
        partner_id: partner.id,
        feedback_type: feedbackType,
        description,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
