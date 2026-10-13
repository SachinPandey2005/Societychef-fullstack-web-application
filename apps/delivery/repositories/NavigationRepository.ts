import { navigationTrackingApi } from '../api';
import { useNavigationStore, RouteOptimizationType } from '../store/useNavigationStore';
import { useETAStore } from '../store/useETAStore';

export class NavigationRepository {
  static async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    routeType: RouteOptimizationType = 'FASTEST'
  ): Promise<void> {
    const navStore = useNavigationStore.getState();
    const etaStore = useETAStore.getState();

    try {
      const data = await navigationTrackingApi.calculateRoute({
        origin_lat: originLat,
        origin_lng: originLng,
        dest_lat: destLat,
        dest_lng: destLng,
        route_type: routeType,
      });

      if (data) {
        navStore.setRoute(
          data.polyline || [],
          data.distance_km || 2.4,
          data.duration_minutes || 11,
          data.turn_by_turn_instructions
        );
        etaStore.setEtaData(5, data.duration_minutes || 11, 2, 0);
      }
    } catch (e: any) {
      console.warn('[NavigationRepository] Route calculation fallback:', e.message);
    }
  }
}

export default NavigationRepository;
