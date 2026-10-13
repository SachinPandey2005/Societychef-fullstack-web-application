import { executionHandoverApi } from '../api';
import { usePickupStore } from '../store/usePickupStore';
import { useOrderStore } from '../store/useOrderStore';

export class PickupRepository {
  static async confirmChecklist(orderId: string): Promise<void> {
    const pickupStore = usePickupStore.getState();
    pickupStore.setSubmitting(true);
    try {
      await executionHandoverApi.confirmPickup(orderId, pickupStore.checklist);
    } catch (e: any) {
      console.warn('[PickupRepository] Confirm checklist fallback:', e.message);
    } finally {
      pickupStore.setSubmitting(false);
    }
  }

  static async verifyChefPin(orderId: string, pin: string): Promise<boolean> {
    const pickupStore = usePickupStore.getState();
    const orderStore = useOrderStore.getState();
    pickupStore.setSubmitting(true);
    try {
      await executionHandoverApi.verifyChefPin(orderId, pin);
      pickupStore.setPinVerified(true);
      await orderStore.advanceOrderStatus(orderId, 'FOOD_PICKED');
      return true;
    } catch (e: any) {
      console.warn('[PickupRepository] Chef PIN verification error:', e.message);
      pickupStore.setPinVerified(false);
      throw e;
    } finally {
      pickupStore.setSubmitting(false);
    }
  }
}

export default PickupRepository;
