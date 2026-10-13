import { settingsApi } from '../api/settings.api';
import { useComplianceStore } from '../store/useComplianceStore';

export class ComplianceRepository {
  static async fetchCompliance(): Promise<void> {
    const store = useComplianceStore.getState();
    store.setLoading(true);
    try {
      const items = await settingsApi.getCompliance();
      if (items) {
        store.setDocuments(items);
      }
    } catch (e: any) {
      console.warn('[ComplianceRepository] Fetch documents error:', e.message);
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  }
}

export default ComplianceRepository;
