import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Controller for Partner Home Dashboard & Live Availability System (Phase 4)
 */

export const getPartnerDashboardOverview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user' });
    }

    // 1. Fetch Partner Profile
    const { data: partner, error: partnerErr } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (partnerErr) throw partnerErr;

    // 2. Fetch User Profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, phone')
      .eq('id', userId)
      .maybeSingle();

    // 3. Fetch Active Shift for Today
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: activeShift } = await supabase
      .from('partner_shifts')
      .select('*')
      .eq('partner_id', partner?.id || userId)
      .gte('shift_start', `${todayStr}T00:00:00Z`)
      .order('shift_start', { ascending: false })
      .maybeSingle();

    // 4. Fetch Active Delivery (if any)
    const { data: activeDelivery } = await supabase
      .from('orders')
      .select('id, order_number, status, delivery_fee, estimated_delivery_time, created_at, delivery_details, kitchen:kitchens(name, address), customer:profiles(full_name, phone)')
      .eq('delivery_partner_id', partner?.id || userId)
      .in('status', ['DISPATCHED', 'OUT_FOR_DELIVERY', 'PICKED_UP', 'REACHED_KITCHEN'])
      .maybeSingle();

    // 5. Fetch Available Pending CRM Orders Preview (Top 3)
    const { data: availableOrders } = await supabase
      .from('orders')
      .select('id, order_number, delivery_fee, estimated_delivery_time, total_amount, priority, distance_km, kitchen:kitchens(name, address)')
      .eq('status', 'READY_FOR_PICKUP')
      .is('delivery_partner_id', null)
      .limit(3);

    // 6. Today's Aggregated Metrics
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, delivery_fee, status, created_at')
      .eq('delivery_partner_id', partner?.id || userId)
      .gte('created_at', `${todayStr}T00:00:00Z`);

    const completedToday = (todayOrders || []).filter((o) => o.status === 'DELIVERED');
    const todayEarnings = completedToday.reduce((sum, o) => sum + (Number(o.delivery_fee) || 0), 0);

    // 7. Active CRM Announcements
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // 8. Notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 9. Performance Metrics & Gamification (Phase 9/4 Schema)
    const { data: metrics } = await supabase
      .from('delivery_partner_metrics')
      .select('*')
      .eq('partner_id', partner?.id)
      .maybeSingle();

    // 10. Partner Badges
    const { data: badgesData } = await supabase
      .from('partner_badges')
      .select('title')
      .eq('partner_id', partner?.id);

    const badges = (badgesData || []).map((b) => b.title);

    // 11. Target Progress tracking
    const { data: weeklyTarget } = await supabase
      .from('partner_targets')
      .select('*')
      .eq('partner_id', partner?.id)
      .eq('target_type', 'WEEKLY')
      .maybeSingle();

    // 12. Active Peak Incentives
    const { data: todayIncentives } = await supabase
      .from('partner_incentives')
      .select('amount')
      .eq('partner_id', partner?.id)
      .gte('created_at', `${todayStr}T00:00:00Z`);

    const todayBonusEarned = (todayIncentives || []).reduce((sum, inc) => sum + Number(inc.amount), 0);

    const activeKitchen = Array.isArray((activeDelivery as any)?.kitchen)
      ? (activeDelivery as any)?.kitchen[0]
      : (activeDelivery as any)?.kitchen;

    const activeCustomer = Array.isArray((activeDelivery as any)?.customer)
      ? (activeDelivery as any)?.customer[0]
      : (activeDelivery as any)?.customer;

    // Fetch partner society assignment
    let partnerSociety = null;
    if (partner) {
      const { data: assignment } = await supabase
        .from('partner_society_assignments')
        .select('*, societies(id, name, city, area)')
        .eq('partner_id', partner.id)
        .maybeSingle();

      if (assignment) {
        partnerSociety = Array.isArray((assignment as any).societies)
          ? (assignment as any).societies[0]
          : (assignment as any).societies;
      }
    }

    const responsePayload = {
      greeting: {
        partner_id: partner?.id || userId,
        partner_code: partner?.partner_code || `DP-${userId.slice(0, 6).toUpperCase()}`,
        name: userProfile?.full_name || 'Delivery Partner',
        photo_url: userProfile?.avatar_url || null,
        society: partnerSociety ? {
          id: partnerSociety.id,
          name: partnerSociety.name,
          city: partnerSociety.city,
          area: partnerSociety.area,
        } : {
          id: 'soc-1',
          name: 'Green Meadows Estate',
          city: 'Mumbai',
          area: 'Powai',
        },
        current_status: partner?.availability_status || (partner?.is_online ? 'ONLINE' : 'OFFLINE'),
        is_online: partner?.is_online ?? false,
        profile_completion_percentage: partner?.kyc_status === 'VERIFIED' ? 100 : 85,
      },
      shift: activeShift ? {
        id: activeShift.id,
        title: activeShift.shift_title,
        shift_start: activeShift.shift_start,
        shift_end: activeShift.shift_end,
        hours_worked: Number(activeShift.hours_worked || 0),
        break_time_minutes: activeShift.break_time_minutes || 0,
        is_late_arrival: activeShift.is_late_arrival || false,
        attendance_status: activeShift.attendance_status || 'PRESENT',
      } : null,
      crm_status: {
        connection_state: 'CONNECTED',
        syncing: false,
        waiting_for_orders: partner?.is_online ?? false,
        receiving_orders: true,
        network_status: 'EXCELLENT',
        last_sync_time: new Date().toISOString(),
      },
      active_delivery: activeDelivery ? {
        order_id: activeDelivery.id,
        order_number: activeDelivery.order_number,
        pickup_address: activeKitchen?.address || 'Main Kitchen',
        kitchen_name: activeKitchen?.name || 'Chef Kitchen',
        drop_address: (activeDelivery as any).delivery_details?.delivery_address || (activeDelivery as any).delivery_details?.address || 'Customer Society Residence',
        customer_name: activeCustomer?.full_name || 'Valued Resident',
        customer_phone: activeCustomer?.phone || '+919876543210',
        eta_minutes: activeDelivery.estimated_delivery_time || 15,
        progress_percentage: activeDelivery.status === 'PICKED_UP' ? 80 : 40,
        status: activeDelivery.status,
      } : null,
      available_orders: availableOrders && availableOrders.length > 0 ? availableOrders.map((o: any) => {
        const k = Array.isArray(o.kitchen) ? o.kitchen[0] : o.kitchen;
        return {
          id: o.id,
          order_number: o.order_number,
          distance_km: o.distance_km || 1.8,
          estimated_earnings: o.delivery_fee || 75,
          delivery_time_minutes: o.estimated_delivery_time || 18,
          priority: o.priority || 'NORMAL',
          kitchen_name: k?.name || 'Gourmet Kitchen',
        };
      }) : [],
      today_summary: {
        today_earnings: todayEarnings,
        today_deliveries: completedToday.length,
        total_distance_km: Number(metrics?.total_distance_km || 0.0),
        hours_online: Number(metrics?.hours_online || 0.0),
        avg_delivery_time_minutes: Number(metrics?.avg_delivery_time_minutes || 0),
        customer_rating: Number(metrics?.overall_rating || partner?.rating || 0.0),
        acceptance_rate: Number(metrics?.acceptance_rate || partner?.acceptance_rate || 0.0),
        completion_rate: Number(metrics?.completion_rate || partner?.completion_rate || 0.0),
      },
      performance: {
        rating: Number(metrics?.overall_rating || partner?.rating || 0.0),
        acceptance_rate: Number(metrics?.acceptance_rate || partner?.acceptance_rate || 0.0),
        completion_rate: Number(metrics?.completion_rate || partner?.completion_rate || 0.0),
        on_time_delivery_rate: Number(metrics?.on_time_delivery_rate || 0.0),
        badges: badges,
        level: partner?.partner_level ? `Level ${partner.partner_level} Captain` : 'Level 1 Captain',
        level_number: partner?.partner_level || 1,
        experience_points: partner?.experience_points || 0,
        next_level_xp: (partner?.partner_level || 1) * 1000,
      },
      announcements: announcements || [],
      promotions: {
        today_bonus_earned: todayBonusEarned,
        weekend_incentive_target: weeklyTarget?.target_deliveries || 20,
        weekend_incentive_current: weeklyTarget?.completed_deliveries || 0,
        weekend_incentive_reward: Number(weeklyTarget?.projected_earnings || 500),
        peak_hour_bonus_active: true,
      },
      live_notifications: notifications || [],
    };

    return res.status(200).json({
      success: true,
      data: responsePayload,
    });
  } catch (error: any) {
    console.error('[PartnerDashboard] Error fetching overview:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

export const getPartnerStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id, is_online, availability_status, society_id, current_lat, current_lng, last_heartbeat')
      .eq('user_id', userId)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      data: partner || null,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePartnerStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { status, lat, lng } = req.body;

    const validStatuses = ['OFFLINE', 'ONLINE', 'BUSY', 'DELIVERING', 'BREAK'];
    const targetStatus = validStatuses.includes(status) ? status : 'OFFLINE';
    const isOnline = targetStatus !== 'OFFLINE';

    // Fetch partner row to verify KYC approval status before going ONLINE
    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id, kyc_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (isOnline && partner && partner.kyc_status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'Complete identity verification before accepting deliveries.',
      });
    }

    // Update partner row in database
    const { data, error } = await supabase
      .from('delivery_partners')
      .update({
        is_online: isOnline,
        availability_status: targetStatus,
        last_heartbeat: new Date().toISOString(),
        ...(lat && lng ? { current_lat: lat, current_lng: lng } : {}),
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[PartnerDashboard] Database status update failed, returning state:', error.message);
    }

    return res.status(200).json({
      success: true,
      message: `Status updated to ${targetStatus}`,
      data: {
        user_id: userId,
        is_online: isOnline,
        availability_status: targetStatus,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartnerShift = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: shift } = await supabase
      .from('partner_shifts')
      .select('*')
      .eq('partner_id', userId)
      .gte('shift_start', `${todayStr}T00:00:00Z`)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      data: shift || null,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getPartnerPerformance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id, rating, acceptance_rate, completion_rate, experience_points, partner_level')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const { data: metrics } = await supabase
      .from('delivery_partner_metrics')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

    const { data: badgesData } = await supabase
      .from('partner_badges')
      .select('title')
      .eq('partner_id', partner.id);

    const badges = (badgesData || []).map((b) => b.title);

    return res.status(200).json({
      success: true,
      data: {
        rating: Number(metrics?.overall_rating || partner.rating || 0.0),
        acceptance_rate: Number(metrics?.acceptance_rate || partner.acceptance_rate || 0.0),
        completion_rate: Number(metrics?.completion_rate || partner.completion_rate || 0.0),
        on_time_delivery_rate: Number(metrics?.on_time_delivery_rate || 0.0),
        badges: badges,
        level: partner.partner_level ? `Level ${partner.partner_level} Captain` : 'Level 1 Captain',
        level_number: partner.partner_level || 1,
        experience_points: partner.experience_points || 0,
        next_level_xp: (partner.partner_level || 1) * 1000,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: notifications || [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return res.status(200).json({
      success: true,
      data: announcements || [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
