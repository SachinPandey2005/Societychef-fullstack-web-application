import { deliveryApi } from './delivery.api';

export const locationApi = {
  streamLocation: async (assignmentId: string, lat: number, lng: number): Promise<void> => {
    await deliveryApi.pushTrackingUpdate(assignmentId, lat, lng);
  },
};

export default locationApi;
