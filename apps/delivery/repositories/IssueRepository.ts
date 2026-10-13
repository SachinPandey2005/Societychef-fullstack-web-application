import { executionHandoverApi } from '../api';
import { useIssueStore, IssueType } from '../store/useIssueStore';

export class IssueRepository {
  static async reportIssue(orderId: string, issueType: IssueType, notes?: string): Promise<void> {
    const issueStore = useIssueStore.getState();
    try {
      const data = await executionHandoverApi.reportIssue(
        orderId,
        issueType,
        notes || issueStore.notes,
        issueStore.photoUris
      );
      if (data && data.ticket_id) {
        issueStore.setTicketId(data.ticket_id);
      }
    } catch (e: any) {
      console.warn('[IssueRepository] Report issue error:', e.message);
      issueStore.setTicketId(`offline_ticket_${Date.now()}`);
    }
  }

  static async triggerEmergencySos(orderId: string): Promise<void> {
    const issueStore = useIssueStore.getState();
    issueStore.setSosTriggered(true);
    await this.reportIssue(orderId, 'EMERGENCY_SOS', 'Partner triggered Emergency SOS button');
  }
}

export default IssueRepository;
