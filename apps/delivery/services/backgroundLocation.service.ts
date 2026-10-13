import { useLocationStore } from '../store/useLocationStore';

export class BackgroundLocationService {
  /**
   * Evaluates speed and battery state to determine adaptive GPS interval
   */
  static getAdaptiveInterval(speedMs: number | null, batteryLevel: number): number {
    // If battery < 15%, low power mode: 20 seconds
    if (batteryLevel < 15) return 20000;

    // Stationary (speed < 1 m/s): 15 seconds
    if (!speedMs || speedMs < 1) return 15000;

    // Moving (speed >= 1 m/s): 5 seconds high frequency tracking
    return 5000;
  }

  /**
   * Anti-spoofing velocity validation check
   */
  static isLocationValid(speedMs: number | null, accuracyMeters: number | null): boolean {
    // Flag if speed > 120 km/h (33.3 m/s) or accuracy > 100 meters
    if (speedMs && speedMs > 33.3) return false;
    if (accuracyMeters && accuracyMeters > 100) return false;
    return true;
  }
}

export default BackgroundLocationService;
