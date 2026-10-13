import { orderManagementApi } from '../api';
import { useOrderStore, OrderLifecycleStatus } from '../store/useOrderStore';

export class OrderRepository {
  static async fetchOrders(tab = 'ACTIVE'): Promise<void> {
    const store = useOrderStore.getState();
    store.fetchOrdersList(tab);
  }

  static async fetchOrderDetails(orderId: string): Promise<void> {
    const store = useOrderStore.getState();
    store.fetchOrderById(orderId);
  }

  static async updateStatus(orderId: string, nextStatus: OrderLifecycleStatus): Promise<void> {
    const store = useOrderStore.getState();
    await store.advanceOrderStatus(orderId, nextStatus);
  }
}

export default OrderRepository;
