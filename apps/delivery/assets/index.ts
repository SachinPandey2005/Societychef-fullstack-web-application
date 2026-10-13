/**
 * Asset Registry for Delivery Partner App.
 * In production, this will load specific static PNGs/JPGs.
 */
export const IMAGES = {
  logo: {
    primary: require('./icon.png'),
    splash: require('./splash-icon.png'),
  },
  icons: {
    scooter: 'scooter', // Vector fallback
  },
  backgrounds: {
    mapPattern: 'map-background',
  },
  illustrations: {
    rider: 'rider-vector',
  },
  banners: {
    welcome: 'welcome-banner',
    heroBanner: require('./delivery-hero-banner.png'),
  },
};

export default IMAGES;
