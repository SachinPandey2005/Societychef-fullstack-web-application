/**
 * Navigation routes configurations.
 * Exports paths and screens mappings for Expo Router.
 */
export type AppRoutes = {
  login: '/(auth)/login';
  otp: '/(auth)/otp';
  home: '/(main)/home';
  orders: '/(main)/orders';
  wallet: '/(main)/wallet';
  support: '/(main)/support';
  profile: '/(main)/profile';
  orderDetails: '/(orders)/[id]';
};

export const ROUTES: AppRoutes = {
  login: '/(auth)/login',
  otp: '/(auth)/otp',
  home: '/(main)/home',
  orders: '/(main)/orders',
  wallet: '/(main)/wallet',
  support: '/(main)/support',
  profile: '/(main)/profile',
  orderDetails: '/(orders)/[id]',
};
