import supabase from '../api/supabase';
import { useDashboardStore } from '../store/useDashboardStore';
import { useAvailabilityStore } from '../store/useAvailabilityStore';
import { useShiftStore } from '../store/useShiftStore';
import { useCrmStatusStore } from '../store/useCrmStatusStore';
import { DashboardRepository } from '../repositories/DashboardRepository';

class RealtimeHubService {
  private subscription: any = null;

  subscribe(partnerId: string, onNotification?: (title: string, body: string) => void) {
    this.unsubscribe();

    useCrmStatusStore.getState().setCrmState('CONNECTED');

    // Subscribe to broadcast & database changes for partner live channel
    const channelName = `partner_channel_${partnerId}`;
    this.subscription = supabase
      .channel(channelName)
      .on('broadcast', { event: 'crm_event' }, (payload) => {
        this.handleCrmEvent(payload.payload, onNotification);
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `delivery_partner_id=eq.${partnerId}` },
        () => {
          DashboardRepository.refreshOverview();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          useCrmStatusStore.getState().setCrmState('WAITING_FOR_ORDERS');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          useCrmStatusStore.getState().setCrmState('DISCONNECTED');
        }
      });
  }

  unsubscribe() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  private handleCrmEvent(eventData: any, onNotification?: (title: string, body: string) => void) {
    if (!eventData) return;
    const { type, message, payload } = eventData;
    const dashStore = useDashboardStore.getState();

    switch (type) {
      case 'PARTNER_ACTIVATED':
        useAvailabilityStore.getState().setStatus('ONLINE');
        onNotification?.('Account Activated', 'Your delivery partner status is now ACTIVE.');
        break;

      case 'PARTNER_SUSPENDED':
        useAvailabilityStore.getState().setStatus('OFFLINE');
        onNotification?.('Account Suspended', 'Please contact support regarding your status.');
        break;

      case 'SHIFT_STARTED':
        if (payload?.shift) {
          useShiftStore.getState().setShift(payload.shift);
        }
        onNotification?.('Shift Started', message || 'Your scheduled shift has officially started.');
        break;

      case 'SHIFT_ENDED':
        onNotification?.('Shift Completed', message || 'Great job! Your shift has ended.');
        break;

      case 'NEW_ORDER':
        if (payload?.order) {
          dashStore.setDashboardData({
            ...dashStore,
            available_orders: [payload.order, ...dashStore.availableOrders],
          });
        }
        onNotification?.('New Order Available', message || 'A new delivery order has been assigned.');
        break;

      case 'ORDER_CANCELLED':
        if (payload?.order_id) {
          dashStore.removeAvailableOrder(payload.order_id);
        }
        onNotification?.('Order Cancelled', message || 'Order assignment was cancelled by customer/system.');
        break;

      case 'EMERGENCY_BROADCAST':
        dashStore.setDashboardData({
          ...dashStore,
          announcements: [
            {
              id: `emer-${Date.now()}`,
              title: 'EMERGENCY BROADCAST',
              content: message || 'Important safety alert broadcast from RasoHi Ops.',
              type: 'ALERT',
              created_at: new Date().toISOString(),
            },
            ...dashStore.announcements,
          ],
        });
        onNotification?.('Emergency Alert', message);
        break;

      case 'MAINTENANCE_NOTICE':
        dashStore.setDashboardData({
          ...dashStore,
          announcements: [
            {
              id: `maint-${Date.now()}`,
              title: 'System Maintenance Notice',
              content: message || 'Scheduled system maintenance in 15 minutes.',
              type: 'MAINTENANCE',
              created_at: new Date().toISOString(),
            },
            ...dashStore.announcements,
          ],
        });
        break;

      default:
        console.log('[RealtimeHubService] Unhandled event:', type);
    }
  }
}

export const realtimeHubService = new RealtimeHubService();
export default realtimeHubService;
