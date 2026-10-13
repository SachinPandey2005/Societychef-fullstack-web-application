import { logger } from '../utils/logger';
import { internalEventBus } from '../events/eventEmitter';

export class TenantService {
  /**
   * Stage 3: Manages Tenant Registration for the MOS
   */
  static async registerTenant(name: string, domainPrefix: string) {
    logger.info(`Registering new SaaS Tenant: ${name} (${domainPrefix})`);
    
    const tenantId = `TENANT_${domainPrefix.toUpperCase()}`;
    
    const tenantConfig = {
      tenantId,
      name,
      domain: `${domainPrefix}.rasohi.com`,
      status: 'ACTIVE',
      plan: 'STARTUP'
    };

    internalEventBus.emit('TENANT_CREATED', tenantConfig);
    return tenantConfig;
  }

  static async getTenantConfig(tenantId: string) {
    // Stub
    return { tenantId, branding: { primaryColor: '#ff0000' } };
  }
}
