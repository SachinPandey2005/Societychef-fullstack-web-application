import { CrmRepository } from '../repositories/crm.repository';
import { NoteEntityType } from '../types/crm';
import { logger } from '../utils/logger';

export class CrmService {
  static async logAction(actor_id: string, action: string, target_entity: string, target_entity_id: string, reason?: string, previous_value?: any, new_value?: any) {
    await CrmRepository.createAuditLog({
      actor_id,
      action,
      target_entity,
      target_entity_id,
      reason,
      previous_value,
      new_value
    });
    logger.info(`[AUDIT] User ${actor_id} performed ${action} on ${target_entity}:${target_entity_id}`);
  }

  static async updateCustomerStatus(admin_id: string, customer_id: string, status: string, reason: string) {
    const updated = await CrmRepository.updateProfileStatus(customer_id, status);
    await this.logAction(admin_id, `UPDATE_CUSTOMER_STATUS_${status.toUpperCase()}`, 'profile', customer_id, reason);
    return updated;
  }

  static async updateChefStatus(admin_id: string, chef_id: string, status: string, reason: string) {
    const updated = await CrmRepository.updateProfileStatus(chef_id, status);
    await this.logAction(admin_id, `UPDATE_CHEF_STATUS_${status.toUpperCase()}`, 'profile', chef_id, reason);
    return updated;
  }

  static async addAdminNote(admin_id: string, entity_type: NoteEntityType, entity_id: string, note: string) {
    return CrmRepository.createAdminNote({
      author_id: admin_id,
      entity_type,
      entity_id,
      note
    });
  }

  static async searchCustomers(query: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    return CrmRepository.searchCustomers(query, limit, offset);
  }

  static async searchChefs(query: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    return CrmRepository.searchChefs(query, limit, offset);
  }

  static async searchSocieties(query: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    return CrmRepository.searchSocieties(query, limit, offset);
  }

  static async searchOrders(params: any) {
    const { OrderService } = require('./order.service');
    return OrderService.searchOrdersExtended(params);
  }

  static async getAuditLogs(entity_type: string | undefined, page: number, limit: number) {
    const offset = (page - 1) * limit;
    return CrmRepository.getAuditLogs(limit, offset, entity_type);
  }

  static async forceUpdateOrderStatus(admin_id: string, order_id: string, status: string, reason: string) {
    // Rely on OrderService for validation & transitions
    const { OrderService } = require('./order.service');
    const updated = await OrderService.updateOrderStatus(order_id, status as any, 'admin');
    await this.logAction(admin_id, `FORCE_UPDATE_ORDER_${status.toUpperCase()}`, 'order', order_id, reason);
    return updated;
  }

  static async searchDeliveryPartners(query: string, page: number, limit: number, status?: string) {
    const offset = (page - 1) * limit;
    return CrmRepository.searchDeliveryPartners(query, limit, offset, status);
  }

  static async updatePartnerStatus(admin_id: string, partner_id: string, status: string, reason: string) {
    const formattedStatus = (status || 'ACTIVE').toUpperCase();
    const updated = await CrmRepository.updatePartnerStatus(partner_id, formattedStatus as any);
    await this.logAction(admin_id, `UPDATE_PARTNER_STATUS_${formattedStatus}`, 'delivery_partner', partner_id, reason);
    return updated;
  }

  static async assignPartnerSociety(admin_id: string, partner_id: string, payload: any) {
    const assigned = await CrmRepository.assignPartnerSociety(partner_id, payload);
    await this.logAction(admin_id, `ASSIGN_PARTNER_SOCIETY`, 'partner_society_assignment', partner_id, `Assigned to society ${payload.society_id}`);
    return assigned;
  }

  static async updatePartnerKycStatus(admin_id: string, partner_id: string, status: 'APPROVED' | 'REJECTED', notes?: string) {
    const updated = await CrmRepository.updatePartnerKycStatus(partner_id, status, notes);
    await this.logAction(admin_id, `UPDATE_PARTNER_KYC_${status.toUpperCase()}`, 'delivery_partner', partner_id, notes || `KYC status set to ${status}`);
    return updated;
  }

  static async getChefProfile(chefId: string) {
    return CrmRepository.getChefProfile(chefId);
  }

  static async getCustomerProfile(customerId: string) {
    return CrmRepository.getCustomerProfile(customerId);
  }
}
