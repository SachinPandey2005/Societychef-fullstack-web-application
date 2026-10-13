import { incidentApi } from '../api/incident.api';
import { useIncidentStore, IncidentRecord } from '../store/useIncidentStore';

export class IncidentRepository {
  static async reportIncident(params: {
    incidentType: string;
    description: string;
    evidenceUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    orderId?: string | null;
  }): Promise<IncidentRecord> {
    const store = useIncidentStore.getState();
    store.setLoading(true);
    try {
      const record = await incidentApi.reportIncident(params);
      if (record) {
        store.addIncident(record);
        return record;
      }
      throw new Error('Failed to record incident response');
    } catch (e: any) {
      console.warn('[IncidentRepository] Incident report failed:', e.message);
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  }
}

export default IncidentRepository;
