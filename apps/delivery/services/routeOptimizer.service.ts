import { RouteCoordinate } from '../store/useNavigationStore';

export class RouteOptimizerService {
  /**
   * Generates polyline coordinates array between origin and destination
   */
  static generateRoutePolyline(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): RouteCoordinate[] {
    return [
      { latitude: startLat, longitude: startLng },
      { latitude: startLat + (endLat - startLat) * 0.33, longitude: startLng + (endLng - startLng) * 0.25 },
      { latitude: startLat + (endLat - startLat) * 0.66, longitude: startLng + (endLng - startLng) * 0.75 },
      { latitude: endLat, longitude: endLng },
    ];
  }
}

export default RouteOptimizerService;
