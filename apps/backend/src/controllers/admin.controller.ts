import { Request, Response } from 'express';
import { FeatureFlagService } from '../services/feature_flag.service';
import { AuditService } from '../services/audit.service';
import { setMaintenanceMode } from '../middleware/maintenance.middleware';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { supabase } from '../config/supabase';

export class AdminController {
  /**
   * Stage 10: Executive Dashboard API
   */
  static async getExecutiveDashboard(req: Request, res: Response) {
    try {
      const stats = await DashboardRepository.getOverviewStats();
      const { data: totalOrders, error } = await supabase
        .from('orders')
        .select('grand_total')
        .eq('payment_status', 'paid');

      if (error) throw error;

      const revenue = totalOrders?.reduce((acc, order) => acc + Number(order.grand_total || 0), 0) || 0;

      res.json({
        revenue,
        activeUsers: stats.total_users,
        systemHealth: 'ONLINE'
      });
    } catch (err) {
      console.error('Failed to load executive dashboard stats', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Stage 4: Feature Flag Management API
   */
  static async toggleFeatureFlag(req: Request, res: Response) {
    const { flagKey, isEnabled } = req.body;
    const adminId = req.user?.id || 'system';

    const result = await FeatureFlagService.setFeatureFlag(flagKey, isEnabled);
    AuditService.logAdminAction(adminId, 'TOGGLE_FEATURE_FLAG', { flagKey, isEnabled });
    
    res.json(result);
  }

  /**
   * Stage 9: Maintenance Mode API
   */
  static async toggleMaintenanceMode(req: Request, res: Response) {
    const { isEnabled } = req.body;
    const adminId = req.user?.id || 'system';

    setMaintenanceMode(isEnabled);
    AuditService.logAdminAction(adminId, 'TOGGLE_MAINTENANCE_MODE', { isEnabled });
    
    res.json({ maintenanceMode: isEnabled });
  }
}
