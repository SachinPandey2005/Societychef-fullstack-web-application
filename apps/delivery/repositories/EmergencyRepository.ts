import { emergencyApi } from '../api/emergency.api';
import { useEmergencyStore } from '../store/useEmergencyStore';

export class EmergencyRepository {
  static async triggerSOS(latitude: number, longitude: number, orderId?: string | null): Promise<void> {
    const store = useEmergencyStore.getState();
    store.setLoading(true);
    try {
      const alarm = await emergencyApi.triggerSOS({ latitude, longitude, orderId });
      if (alarm) {
        store.setAlarmId(alarm.id);
        store.setSosTriggered(true);
      }
    } catch (e: any) {
      console.warn('[EmergencyRepository] SOS Trigger Error:', e.message);
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  }

  static cancelLocalSOS(): void {
    const store = useEmergencyStore.getState();
    store.setSosTriggered(false);
    store.setAlarmId(null);
  }
}

export default EmergencyRepository;
