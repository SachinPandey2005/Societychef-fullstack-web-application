import { useTrackingStore, GeofenceStatus } from '../store/useTrackingStore';

export class GeofenceService {
  private static GEOFENCE_RADIUS_METERS = 75; // 75 meters arrival radius

  /**
   * Haversine formula to compute distance in meters between two lat/lng points
   */
  static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Evaluates partner position relative to target kitchen or customer coordinates
   */
  static evaluatePosition(
    currentLat: number,
    currentLng: number,
    targetLat: number,
    targetLng: number,
    targetType: 'KITCHEN' | 'CUSTOMER'
  ): GeofenceStatus {
    const distance = this.calculateDistanceMeters(currentLat, currentLng, targetLat, targetLng);
    const trackingStore = useTrackingStore.getState();

    let newStatus: GeofenceStatus = 'OUTSIDE_RADIUS';

    if (distance <= this.GEOFENCE_RADIUS_METERS) {
      newStatus = targetType === 'KITCHEN' ? 'KITCHEN_ARRIVED' : 'CUSTOMER_ARRIVED';
    } else if (distance <= 300) {
      newStatus = targetType === 'KITCHEN' ? 'APPROACHING_KITCHEN' : 'APPROACHING_CUSTOMER';
    }

    trackingStore.setGeofenceStatus(newStatus, distance);
    return newStatus;
  }
}

export default GeofenceService;
