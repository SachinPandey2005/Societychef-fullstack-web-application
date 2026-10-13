import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Stage 2 & 16: Multi-Tenant Context Resolver
 * Evaluates cascading identifiers to isolate requests logically.
 */
export const resolveTenantContext = (req: Request, res: Response, next: NextFunction) => {
  let tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    const host = req.headers['host'] || '';
    // Example: tenant1.rasohi.com
    if (host.includes('.rasohi.com')) {
      tenantId = host.split('.')[0];
    } else {
      tenantId = 'DEFAULT_GLOBAL_TENANT';
    }
  }

  // Attach strictly to request context
  (req as any).tenantId = tenantId;
  
  // Debug log (throttled in prod)
  // logger.debug(`Request isolated to Tenant: ${tenantId}`);

  next();
};
