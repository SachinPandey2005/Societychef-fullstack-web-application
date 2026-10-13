import { executionHandoverApi } from '../api';
import { useDeliveryStore } from '../store/useDeliveryStore';
import { useOrderStore } from '../store/useOrderStore';
import { useOTPStore } from '../store/useOTPStore';

export class DeliveryRepository {
  static async completeDelivery(
    orderId: string,
    latitude?: number,
    longitude?: number
  ): Promise<void> {
    const deliveryStore = useDeliveryStore.getState();
    const otpStore = useOTPStore.getState();
    const orderStore = useOrderStore.getState();

    deliveryStore.setSubmitting(true);
    try {
      await executionHandoverApi.completeDelivery(orderId, otpStore.isOtpVerified, latitude, longitude);
      deliveryStore.setDelivered(true);
      deliveryStore.setCurrentStep('DELIVERED');
      await orderStore.advanceOrderStatus(orderId, 'DELIVERED');
    } catch (e: any) {
      console.warn('[DeliveryRepository] Complete delivery error:', e.message);
      throw e;
    } finally {
      deliveryStore.setSubmitting(false);
    }
  }
}

export default DeliveryRepository;
