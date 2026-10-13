import { DisputeRepository } from '../repositories/dispute.repository';
import { CrmRepository } from '../repositories/crm.repository';
import { NotificationService } from './notification.service';
import { NotFoundError } from '../utils/errors';
import { DisputeCase, DisputeComment } from '../types/refund';

export class DisputeService {
  static async createDispute(data: Partial<DisputeCase>, actor_id?: string): Promise<DisputeCase> {
    const dispute = await DisputeRepository.createDispute({
      ...data,
      status: 'PENDING',
      priority: data.priority || 'MEDIUM',
    });

    await CrmRepository.createAuditLog({
      actor_id: actor_id || 'USER',
      action: 'CREATE_DISPUTE',
      target_entity: 'dispute',
      target_entity_id: dispute.id,
      new_value: dispute,
      reason: `Dispute created [${dispute.category}] priority: ${dispute.priority}`,
    });

    // Notify Support/Finance Admin if URGENT or HIGH
    if (dispute.priority === 'URGENT' || dispute.priority === 'HIGH') {
      try {
        await NotificationService.sendNotification({
          profile_id: actor_id || 'SYSTEM',
          title: 'High Priority Dispute Created 🚨',
          message: `Dispute #${dispute.dispute_code || dispute.id} created under category ${dispute.category}`,
          type: 'DISPUTE_ESCALATED',
        });
      } catch (e) {
        console.warn('Failed to notify support admin:', e);
      }
    }

    return dispute;
  }

  static async getDisputes(filters?: any): Promise<DisputeCase[]> {
    return DisputeRepository.getDisputes(50, 0, filters);
  }

  static async getDisputeById(id: string): Promise<DisputeCase> {
    const dispute = await DisputeRepository.findById(id);
    if (!dispute) throw new NotFoundError(`Dispute #${id} not found`);
    return dispute;
  }

  static async updateDisputeStatus(
    id: string,
    status: DisputeCase['status'],
    resolution_notes?: string,
    actor_id?: string,
    assigned_agent_id?: string
  ): Promise<DisputeCase> {
    const current = await DisputeRepository.findById(id);
    const updated = await DisputeRepository.updateDispute(id, {
      status,
      resolution_notes,
      assigned_agent_id: assigned_agent_id || current?.assigned_agent_id,
    });

    await CrmRepository.createAuditLog({
      actor_id: actor_id || 'FINANCE_ADMIN',
      action: `RESOLVE_DISPUTE_${status}`,
      target_entity: 'dispute',
      target_entity_id: id,
      previous_value: { status: current?.status },
      new_value: { status, resolution_notes },
      reason: `Dispute #${id} updated to ${status}. Notes: ${resolution_notes || 'N/A'}`,
    });

    // Notify customer if resolved
    if (status === 'RESOLVED' && current?.customer_id) {
      try {
        await NotificationService.sendNotification({
          profile_id: current.customer_id,
          title: 'Dispute Resolved ✅',
          message: `Your dispute for Order #${current.order_id?.substring(0, 8)} has been resolved. Note: ${resolution_notes || 'Resolved by finance team'}`,
          type: 'SUPPORT_TICKET',
        });
      } catch (e) {
        console.warn('Failed to notify customer of dispute resolution:', e);
      }
    }

    return updated;
  }

  static async addComment(comment: Partial<DisputeComment>): Promise<DisputeComment> {
    const result = await DisputeRepository.addComment(comment);
    await CrmRepository.createAuditLog({
      actor_id: comment.author_id || 'SYSTEM',
      action: 'ADD_DISPUTE_COMMENT',
      target_entity: 'dispute',
      target_entity_id: comment.dispute_id || '',
      new_value: result,
      reason: `Comment added to dispute: ${comment.comment?.substring(0, 40)}`,
    });
    return result;
  }

  static async getComments(dispute_id: string): Promise<DisputeComment[]> {
    return DisputeRepository.getComments(dispute_id);
  }
}
