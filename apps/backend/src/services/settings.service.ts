import { SettingsRepository } from '../repositories/settings.repository';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { CrmRepository } from '../repositories/crm.repository';

export class SettingsService {
  static async getAllSettings() {
    return SettingsRepository.getAllSettings();
  }

  static async updateSetting(key: string, value: any, admin_id: string) {
    const existing = await SettingsRepository.getSetting(key);
    if (!existing) throw new NotFoundError(`Setting ${key} not found`);

    const updated = await SettingsRepository.updateSetting(key, value, admin_id);
    
    // Log setting change
    await CrmRepository.createAuditLog({
      actor_id: admin_id,
      action: 'UPDATE_PLATFORM_SETTING',
      target_entity: 'platform_settings',
      target_entity_id: key,
      previous_value: existing.value,
      new_value: value,
      reason: 'Admin updated setting'
    });

    logger.info(`Setting ${key} updated to ${JSON.stringify(value)} by ${admin_id}`);
    return updated;
  }
}
