import { apiClient } from './client';

export interface SettingsPayload {
  id: string;
  partner_id: string;
  language: 'en' | 'hi' | 'kn' | 'ta';
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  biometrics_enabled: boolean;
  location_preferences: 'ALWAYS' | 'WHILE_USING' | 'DISABLED';
  map_preferences: 'GOOGLE' | 'APPLE' | 'OSM';
  updated_at: string;
}

export interface ComplianceDoc {
  id: string;
  document_type: 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE' | 'PARTNER_AGREEMENT' | 'LICENSES';
  title: string;
  content: string;
  version: string;
  updated_at: string;
}

export const settingsApi = {
  getSettings: async (): Promise<SettingsPayload> => {
    const response = await apiClient.get<SettingsPayload>('/settings');
    return response.data;
  },

  updateSettings: async (params: {
    language?: 'en' | 'hi' | 'kn' | 'ta';
    theme?: 'light' | 'dark' | 'system';
    notificationsEnabled?: boolean;
    biometricsEnabled?: boolean;
    locationPreferences?: 'ALWAYS' | 'WHILE_USING' | 'DISABLED';
    mapPreferences?: 'GOOGLE' | 'APPLE' | 'OSM';
  }): Promise<SettingsPayload> => {
    const response = await apiClient.put<SettingsPayload>('/settings', params);
    return response.data;
  },

  getCompliance: async (): Promise<ComplianceDoc[]> => {
    const response = await apiClient.get<ComplianceDoc[]>('/compliance');
    return response.data;
  },

  requestAccountDelete: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/account/delete-request');
    return response.data;
  },

  requestAccountExport: async (): Promise<{ message: string; data: { export_download_url: string } }> => {
    const response = await apiClient.post<{ message: string; data: { export_download_url: string } }>('/account/export-request');
    return response.data;
  },
};

export default settingsApi;
