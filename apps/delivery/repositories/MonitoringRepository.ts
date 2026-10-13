import { useMonitoringStore } from '../store/useMonitoringStore';

export class MonitoringRepository {
  static trackApiLatency(latencyMs: number): void {
    const store = useMonitoringStore.getState();
    store.updateMetrics({ apiLatency: latencyMs });
  }

  static trackConnectionStatus(connected: boolean): void {
    const store = useMonitoringStore.getState();
    store.updateMetrics({ realtimeConnected: connected });
  }

  static trackGpsAvailability(available: boolean): void {
    const store = useMonitoringStore.getState();
    store.updateMetrics({ gpsAvailable: available });
  }

  static trackBatteryImpact(impact: boolean): void {
    const store = useMonitoringStore.getState();
    store.updateMetrics({ batteryOptimizationImpact: impact });
  }
}

export default MonitoringRepository;
