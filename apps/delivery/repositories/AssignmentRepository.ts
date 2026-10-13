import { orderManagementApi } from '../api';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useOrderStore } from '../store/useOrderStore';

export class AssignmentRepository {
  static async acceptAssignment(orderId: string): Promise<void> {
    const assignStore = useAssignmentStore.getState();
    const orderStore = useOrderStore.getState();

    try {
      await orderManagementApi.acceptOrder(orderId);
      await orderStore.fetchOrderById(orderId);
    } catch (e: any) {
      console.warn('[AssignmentRepository] Accept assignment fallback:', e.message);
    } finally {
      assignStore.dismissModal();
    }
  }

  static async rejectAssignment(orderId: string, reason: string, notes?: string): Promise<void> {
    const assignStore = useAssignmentStore.getState();
    try {
      await orderManagementApi.rejectOrder(orderId, reason, notes);
    } catch (e: any) {
      console.warn('[AssignmentRepository] Reject assignment fallback:', e.message);
    } finally {
      assignStore.dismissModal();
    }
  }

  static async handleTimeout(orderId: string): Promise<void> {
    await this.rejectAssignment(orderId, 'TIMEOUT', 'Assignment 30s timer expired auto-rejected');
  }
}

export default AssignmentRepository;
