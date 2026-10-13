import { create } from 'zustand';

interface ETAState {
  pickupEtaMinutes: number;
  deliveryEtaMinutes: number;
  trafficDelayMinutes: number;
  weatherDelayMinutes: number;
  estimatedArrivalTimestamp: string;

  setEtaData: (pickup: number, delivery: number, trafficDelay?: number, weatherDelay?: number) => void;
}

export const useETAStore = create<ETAState>((set) => ({
  pickupEtaMinutes: 5,
  deliveryEtaMinutes: 12,
  trafficDelayMinutes: 2,
  weatherDelayMinutes: 0,
  estimatedArrivalTimestamp: new Date(Date.now() + 12 * 60000).toISOString(),

  setEtaData: (pickupEtaMinutes, deliveryEtaMinutes, trafficDelayMinutes = 0, weatherDelayMinutes = 0) => {
    const totalMinutes = deliveryEtaMinutes + trafficDelayMinutes + weatherDelayMinutes;
    set({
      pickupEtaMinutes,
      deliveryEtaMinutes,
      trafficDelayMinutes,
      weatherDelayMinutes,
      estimatedArrivalTimestamp: new Date(Date.now() + totalMinutes * 60000).toISOString(),
    });
  },
}));
