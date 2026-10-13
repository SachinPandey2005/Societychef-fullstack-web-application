import { ComplaintRepository } from '../repositories/complaint.repository';
import { CrmService } from './crm.service';
import { ComplaintType, ComplaintStatus } from '../types/complaint';

export class ComplaintService {
  static async createComplaint(reporter_id: string, type: ComplaintType, description: string, target_id?: string) {
    return ComplaintRepository.createComplaint({ reporter_id, type, description, target_id });
  }

  static async updateStatus(admin_id: string, complaint_id: string, status: ComplaintStatus, resolution_notes?: string) {
    const complaint = await ComplaintRepository.updateStatus(complaint_id, status, resolution_notes);
    await CrmService.logAction(admin_id, `COMPLAINT_STATUS_${status}`, 'complaint', complaint_id, resolution_notes);
    return complaint;
  }

  static async getComplaints(page: number, limit: number) {
    const offset = (page - 1) * limit;
    return ComplaintRepository.getComplaints(limit, offset);
  }
}
