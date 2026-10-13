import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Controller for Settings, Devices, Compliance, Offline Sync, and Audit Logging (Phase 11)
 */

export const getSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    // Retrieve settings or insert default ones
    let { data: settings, error } = await supabase
      .from('partner_settings')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

    if (!settings) {
      const { data: defaultSettings, error: insertErr } = await supabase
        .from('partner_settings')
        .insert({
          partner_id: partner.id,
          language: 'en',
          theme: 'light',
          notifications_enabled: true,
          biometrics_enabled: false,
          location_preferences: 'ALWAYS',
          map_preferences: 'GOOGLE',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      settings = defaultSettings;
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { language, theme, notificationsEnabled, biometricsEnabled, locationPreferences, mapPreferences } = req.body;

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const { data: updated, error } = await supabase
      .from('partner_settings')
      .update({
        language,
        theme,
        notifications_enabled: notificationsEnabled,
        biometrics_enabled: biometricsEnabled,
        location_preferences: locationPreferences,
        map_preferences: mapPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('partner_id', partner.id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getDevices = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const { data: devices, error } = await supabase
      .from('partner_devices')
      .select('*')
      .eq('partner_id', partner.id)
      .eq('is_active', true)
      .order('last_login_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: devices || [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const logoutDevice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { deviceId, logoutAllOthers } = req.body;

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    if (logoutAllOthers) {
      // Deactivate other device entries
      const { error } = await supabase
        .from('partner_devices')
        .update({ is_active: false })
        .eq('partner_id', partner.id)
        .neq('id', deviceId || '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
    } else if (deviceId) {
      const { error } = await supabase
        .from('partner_devices')
        .update({ is_active: false })
        .eq('id', deviceId)
        .eq('partner_id', partner.id);

      if (error) throw error;
    } else {
      return res.status(400).json({ success: false, error: 'Device ID or logoutAllOthers parameter is required' });
    }

    return res.status(200).json({
      success: true,
      message: 'Session device logged out successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getComplianceDocs = async (req: Request, res: Response) => {
  try {
    const { data: docs, error } = await supabase
      .from('compliance_docs')
      .select('*')
      .order('title', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: docs || [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAccountRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    // Log the event as critical audit log trace
    await supabase
      .from('system_audit_logs')
      .insert({
        partner_id: partner.id,
        event_type: 'ACCOUNT_DELETION_REQUESTED',
        severity: 'CRITICAL',
        description: 'GDPR / Compliance: Account deletion requested by partner.',
      });

    return res.status(200).json({
      success: true,
      message: 'Account deletion request queued. Support team will verify and execute within 15 business days.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const exportAccountRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id, full_name, email, phone')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    // Log the event as warning log audit trace
    await supabase
      .from('system_audit_logs')
      .insert({
        partner_id: partner.id,
        event_type: 'ACCOUNT_EXPORT_REQUESTED',
        severity: 'WARNING',
        description: 'GDPR / Compliance: Partner requested data extraction dump.',
      });

    return res.status(200).json({
      success: true,
      message: 'Data export package prepared successfully.',
      data: {
        partner_profile: partner,
        export_download_url: `https://api.societychef.com/compliance/export/download/${partner.id}_archive.json`,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const synchronizeQueue = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const { queuedActions } = req.body;

    if (!Array.isArray(queuedActions)) {
      return res.status(400).json({ success: false, error: 'queuedActions must be a valid array' });
    }

    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const syncedIds: string[] = [];

    // Process actions and update DB tables
    for (const action of queuedActions) {
      const { id, orderId, status, timestamp } = action;
      if (!orderId || !status) continue;

      // Conflict Resolution logic comparing DB timestamp vs Client timestamp
      const { data: order } = await supabase
        .from('orders')
        .select('updated_at, status')
        .eq('id', orderId)
        .maybeSingle();

      if (order) {
        const dbTime = new Date(order.updated_at).getTime();
        const clientTime = new Date(timestamp).getTime();

        if (clientTime >= dbTime) {
          // Client action is newer - overwrite server status
          await supabase
            .from('orders')
            .update({
              status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
      }

      syncedIds.push(id);
    }

    // Register active sync event in system logs
    await supabase
      .from('system_audit_logs')
      .insert({
        partner_id: partner.id,
        event_type: 'OFFLINE_QUEUE_SYNCED',
        severity: 'INFO',
        description: `Sync Engine: Processed ${queuedActions.length} offline status changes.`,
      });

    return res.status(200).json({
      success: true,
      message: 'Offline synchronization complete',
      syncedIds,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
