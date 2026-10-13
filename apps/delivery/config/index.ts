/**
 * Global App Environment Configurations
 */
const isExplicitlyEnabled =
  typeof process !== 'undefined' &&
  (process.env?.EXPO_PUBLIC_DEV_PHONE_AUTH === 'true' || process.env?.DEV_PHONE_AUTH === 'true');

const isExplicitlyDisabled =
  typeof process !== 'undefined' &&
  (process.env?.EXPO_PUBLIC_DEV_PHONE_AUTH === 'false' || process.env?.DEV_PHONE_AUTH === 'false');

const isProd =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' && !isExplicitlyEnabled) || false;

// Default to enabled in dev/QA mode or when EXPO_PUBLIC_DEV_PHONE_AUTH=true unless explicitly disabled
const isDevAuth = isExplicitlyEnabled || (!isProd && !isExplicitlyDisabled);

export const CONFIG = {
  env: isProd ? 'production' : 'development',
  appName: 'RasoHi Delivery Partner',
  sentryDsn: '',
  enableMockData: true,
  trackingIntervalMs: 10000, // background location updates
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '',
  // TEMP DEV-ONLY: set DEV_PHONE_AUTH flag for local testing & QA preview builds
  DEV_PHONE_AUTH: isDevAuth,
};

export default CONFIG;
