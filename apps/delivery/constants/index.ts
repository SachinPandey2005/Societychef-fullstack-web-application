import { designTokens } from '../theme/tokens';

export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = '1';

export const API_CONFIG = {
  DEV_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://societychef-1.onrender.com',
  STAGING_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://societychef-1.onrender.com',
  PROD_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://societychef-1.onrender.com',
  TIMEOUT: 15000,
};

export const SUPABASE_CONFIG = {
  URL: 'https://vpfnuomnocriemubjotd.supabase.co',
  ANON_KEY: 'sb_publishable_Cog0fOUpVDVEFpzhT5IRIw_tZRpk32y',
};

export const ANIMATION_CONFIG = {
  FADE: {
    duration: designTokens.durations.normal,
  },
  SLIDE: {
    duration: designTokens.durations.slow,
  },
  SHIMMER: {
    duration: designTokens.durations.shimmer,
  },
};

export const STORAGE_KEYS = {
  THEME: 'societychef-delivery-theme-store',
  USER_SESSION: 'societychef-delivery-user-session',
  SETTINGS: 'societychef-delivery-settings',
};

export const MAP_CONFIG = {
  DEFAULT_LAT: 12.9716, // Bangalore default
  DEFAULT_LNG: 77.5946,
  ZOOM: 14,
};

export const EMERGENCY_SERVICES = {
  POLICE: '100',
  AMBULANCE: '102',
  SUPPORT: '+91 8095958822',
};

export default {
  tokens: designTokens,
  version: APP_VERSION,
  build: BUILD_NUMBER,
  api: API_CONFIG,
  supabase: SUPABASE_CONFIG,
  animations: ANIMATION_CONFIG,
  storage: STORAGE_KEYS,
  map: MAP_CONFIG,
  emergency: EMERGENCY_SERVICES,
};
