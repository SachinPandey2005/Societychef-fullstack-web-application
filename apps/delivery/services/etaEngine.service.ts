import { useETAStore } from '../store/useETAStore';

export class EtaEngineService {
  /**
   * Dynamically calculates arrival ETA based on distance, traffic conditions, and weather
   */
  static calculateEta(
    distanceKm: number,
    averageSpeedKmh: number = 25,
    trafficDelayMins: number = 2,
    isRaining: boolean = false
  ): { pickupEta: number; deliveryEta: number; totalEta: number } {
    const baseTravelHours = distanceKm / Math.max(10, averageSpeedKmh);
    const baseTravelMinutes = Math.round(baseTravelHours * 60);

    const weatherDelay = isRaining ? 5 : 0;
    const totalDeliveryEta = baseTravelMinutes + trafficDelayMins + weatherDelay;
    const pickupEta = Math.max(2, Math.round(totalDeliveryEta * 0.4));

    useETAStore.getState().setEtaData(pickupEta, totalDeliveryEta, trafficDelayMins, weatherDelay);

    return {
      pickupEta,
      deliveryEta: totalDeliveryEta,
      totalEta: totalDeliveryEta,
    };
  }
}

export default EtaEngineService;
