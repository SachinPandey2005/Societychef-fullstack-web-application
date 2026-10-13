import { settingsApi } from '../api/settings.api';
import { useSettingsStore } from '../store/useSettingsStore';

export class SettingsRepository {
  static async fetchSettings(): Promise<void> {
    const store = useSettingsStore.getState();
    store.setLoading(true);
    try {
      const settings = await settingsApi.getSettings();
      if (settings) {
        store.setLanguage(settings.language);
        store.setTheme(settings.theme);
        store.setNotificationsEnabled(settings.notifications_enabled);
        store.setBiometricsEnabled(settings.biometrics_enabled);
        store.setLocationPreferences(settings.location_preferences);
        store.setMapPreferences(settings.map_preferences);
      }
    } catch (e: any) {
      console.warn('[SettingsRepository] Fetch settings error:', e.message);
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  }

  static async updateSettings(params: {
    language?: 'en' | 'hi' | 'kn' | 'ta';
    theme?: 'light' | 'dark' | 'system';
    notificationsEnabled?: boolean;
    biometricsEnabled?: boolean;
    locationPreferences?: 'ALWAYS' | 'WHILE_USING' | 'DISABLED';
    mapPreferences?: 'GOOGLE' | 'APPLE' | 'OSM';
  }): Promise<void> {
    const store = useSettingsStore.getState();
    store.setLoading(true);
    try {
      const settings = await settingsApi.updateSettings(params);
      if (settings) {
        store.setLanguage(settings.language);
        store.setTheme(settings.theme);
        store.setNotificationsEnabled(settings.notifications_enabled);
        store.setBiometricsEnabled(settings.biometrics_enabled);
        store.setLocationPreferences(settings.location_preferences);
        store.setMapPreferences(settings.map_preferences);
      }
    } catch (e: any) {
      console.warn('[SettingsRepository] Update settings error:', e.message);
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  }

  static async requestDelete(): Promise<void> {
    await settingsApi.requestAccountDelete();
  }

  static async requestExport(): Promise<string> {
    const data = await settingsApi.requestAccountExport();
    return data.data.export_download_url;
  }
}

export default SettingsRepository;
