import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMapStore, MapStyleType } from '../store/useMapStore';

const CACHED_ROUTE_KEY = 'societychef_cached_map_route';

export class MapsRepository {
  static async setMapStyle(style: MapStyleType): Promise<void> {
    useMapStore.getState().setMapStyle(style);
  }

  static async cacheActiveRoute(routeData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_ROUTE_KEY, JSON.stringify(routeData));
    } catch (e) {
      console.warn('[MapsRepository] Failed to cache active map route:', e);
    }
  }

  static async getCachedRoute(): Promise<any | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHED_ROUTE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export default MapsRepository;
