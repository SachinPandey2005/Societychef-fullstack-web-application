import { Request, Response } from 'express';
import { TenantService } from '../services/tenant.service';
import { sendError, sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';

export class PlatformController {
  /**
   * Stage 13: Centralized MOS Administration
   */
  static async registerTenant(req: Request, res: Response) {
    try {
      const { name, domainPrefix } = req.body;
      if (!name || !domainPrefix) return sendError(res, 'Missing tenant name or domainPrefix', null, 400);

      const newTenant = await TenantService.registerTenant(name, domainPrefix);
      sendSuccess(res, 'Tenant registered successfully', newTenant, 201);
    } catch (err) {
      logger.error('Failed to register tenant', err);
      sendError(res, 'Tenant registration failed', null, 500);
    }
  }

  static async getTenantStatus(req: Request, res: Response) {
    try {
      const { count, error } = await supabase
        .from('societies')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      sendSuccess(res, 'Tenant status retrieved', {
        status: 'OPERATIONAL',
        activeTenants: count || 1
      });
    } catch (err) {
      logger.error('Failed to get tenant status', err);
      sendError(res, 'Failed to get tenant status', null, 500);
    }
  }
}
