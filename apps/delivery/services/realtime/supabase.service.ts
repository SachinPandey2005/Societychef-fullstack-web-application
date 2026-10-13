import supabase from '../../api/supabase';
import { useOrderStore } from '../../store/useOrderStore';
import { useAssignmentStore } from '../../store/useAssignmentStore';
import { ordersApi } from '../../api/orders.api';
import { RealtimeChannel } from '@supabase/supabase-js';

let assignmentChannel: RealtimeChannel | null = null;

export const realtimeService = {
  subscribeToAssignments: (partnerId: string) => {
    if (assignmentChannel) {
      assignmentChannel.unsubscribe();
    }

    console.log(`[realtimeService] Subscribing to realtime delivery assignments for partner: ${partnerId}`);

    assignmentChannel = supabase
      .channel(`delivery_partner:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `partner_id=eq.${partnerId}`,
        },
        async (payload) => {
          console.log('[realtimeService] New assignment insert event received', payload);
          const newAssignment = payload.new;
          if (newAssignment.status === 'ASSIGNED') {
            try {
              const orderDetails = await ordersApi.getOrderDetails(newAssignment.order_id);
              useAssignmentStore.getState().setIncomingOrder({
                id: newAssignment.order_id,
                order_number: orderDetails.order_number || 'ORD-NEW',
                kitchen_name: orderDetails.kitchens?.name || 'Chef Kitchen',
                chef_name: orderDetails.kitchens?.chef_name || 'Chef',
                pickup_address: orderDetails.kitchens?.address || 'Pickup Address',
                customer_name: orderDetails.profiles?.full_name || 'Resident',
                drop_address: orderDetails.delivery_address || 'Drop Address',
                distance_km: 1.5,
                estimated_delivery_time: 15,
                delivery_fee: orderDetails.delivery_fee || 85,
                priority: 'NORMAL',
                order_value: 350,
                preparation_status: 'COOKING',
                items_count: orderDetails.items ? orderDetails.items.length : 2,
                expires_in_seconds: 30,
              });
            } catch (e) {
              console.error('Failed to resolve order details on assignment:', e);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `partner_id=eq.${partnerId}`,
        },
        async (payload) => {
          console.log('[realtimeService] Assignment status update received', payload);
          const updatedAssignment = payload.new;
          
          if (updatedAssignment.status === 'CANCELLED') {
            useOrderStore.getState().setActiveOrder(null);
            console.log('[realtimeService] Active delivery assignment was cancelled.');
          } else {
            useOrderStore.getState().fetchOrderById(updatedAssignment.order_id);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[realtimeService] Subscription status: ${status}`);
      });
  },

  unsubscribeFromAssignments: () => {
    if (assignmentChannel) {
      console.log('[realtimeService] Unsubscribing from assignments channel');
      assignmentChannel.unsubscribe();
      assignmentChannel = null;
    }
  },
};

export default realtimeService;
