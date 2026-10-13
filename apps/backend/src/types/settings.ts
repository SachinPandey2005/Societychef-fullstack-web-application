export interface PlatformSetting {
  key: string;
  value: any;
  category: 'FINANCE' | 'SYSTEM' | 'OPERATIONS' | 'MARKETING';
  description: string;
  updated_at?: string;
  updated_by?: string;
}
