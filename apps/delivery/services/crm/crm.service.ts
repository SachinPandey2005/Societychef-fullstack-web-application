import { crmSocket } from './crm.socket';
import { useAssignmentStore } from '../../store/useAssignmentStore';
import { CRMDispatchPayload } from './crm.types';

export const crmService = {
  initializeDispatchListener: (partnerId: string) => {
    crmSocket.connect(partnerId, (payload: CRMDispatchPayload) => {
      // Map CRM dispatch payload to IncomingOrderPayload for 30s countdown popup
      const incomingPayload: any = {
        id: payload.orderId,
        order_number: `ORD-${payload.orderId.substring(0, 8).toUpperCase()}`,
        kitchen_name: payload.chefName,
        chef_name: payload.chefName,
        pickup_address: payload.pickupAddress,
        customer_name: payload.customerName,
        drop_address: payload.dropAddress,
        distance_km: 1.8,
        estimated_delivery_time: 15,
        delivery_fee: payload.deliveryFee,
        priority: 'EXPRESS',
        order_value: payload.deliveryFee * 3,
        preparation_status: 'PREPARATION_COMPLETE',
        items_count: payload.items ? payload.items.length : 2,
        expires_in_seconds: 30,
      };

      // Trigger full screen incoming assignment modal with 30s countdown timer
      useAssignmentStore.getState().setIncomingOrder(incomingPayload);
    });
  },

  terminateDispatchListener: () => {
    crmSocket.disconnect();
  },
};

export default crmService;
