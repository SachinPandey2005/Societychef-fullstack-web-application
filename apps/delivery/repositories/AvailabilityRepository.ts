import { dashboardApi } from '../api/dashboard.api';
import { useAvailabilityStore, AvailabilityStateMode } from '../store/useAvailabilityStore';
import { useCrmStatusStore } from '../store/useCrmStatusStore';

export class AvailabilityRepository {
  static async updateStatus(status: AvailabilityStateMode, lat?: number, lng?: number): Promise<void> {
    const availStore = useAvailabilityStore.getState();
    const crmStore = useCrmStatusStore.getState();
    availStore.setIsUpdating(true);

    try {
      availStore.setStatus(status);
      crmStore.setSyncing(true);

      await dashboardApi.updatePartnerStatus(status, lat, lng);
      
      crmStore.touchSync();
      crmStore.setCrmState(status === 'OFFLINE' ? 'CONNECTED' : 'WAITING_FOR_ORDERS');
    } catch (error: any) {
      console.warn('[AvailabilityRepository] Online status update failed locally cached:', error.message);
      availStore.setError(error.message || 'Status update offline cache applied');
    } finally {
      availStore.setIsUpdating(false);
      crmStore.setSyncing(false);
    }
  }

  static async fetchStatus(): Promise<void> {
    const availStore = useAvailabilityStore.getState();
    try {
      const data = await dashboardApi.getPartnerStatus();
      if (data?.availability_status) {
        availStore.setStatus(data.availability_status as AvailabilityStateMode);
      }
    } catch (error: any) {
      console.warn('[AvailabilityRepository] Fetch status warning:', error.message);
    }
  }
}

export default AvailabilityRepository;
