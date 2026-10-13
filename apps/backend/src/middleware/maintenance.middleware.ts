import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

// Stub representing active maintenance state. In reality, read from DB/cache.
let isMaintenanceActive = false;

export const setMaintenanceMode = (active: boolean) => {
  isMaintenanceActive = active;
};

/**
 * Stage 9: Maintenance Management
 * Blocks traffic during active maintenance windows, unless the user is a SUPER_ADMIN.
 */
export const requireSystemOnline = (req: Request, res: Response, next: NextFunction) => {
  if (!isMaintenanceActive) {
    return next();
  }

  // Bypass for SUPER_ADMIN (if user info is available this early in the stack, 
  // otherwise they'll need a specific header or bypass token)
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  
  // Alternative bypass via secure header for testing/admin verification
  const bypassHeader = req.headers['x-maintenance-bypass'];
  if (isSuperAdmin || bypassHeader === process.env.MAINTENANCE_BYPASS_TOKEN) {
    logger.warn('Maintenance bypass used');
    return next();
  }

  return sendError(res, 'The system is currently undergoing scheduled maintenance. Please try again later.', { estimatedRestorationTime: new Date(Date.now() + 1000 * 60 * 60).toISOString() }, 503);
};
