import { ReportsRepository } from '../repositories/reports.repository';
import { CrmRepository } from '../repositories/crm.repository';

export class ReportsService {
  static async getOrdersReport(startDate?: string, endDate?: string, admin_id?: string) {
    if (admin_id) {
      await CrmRepository.createAuditLog({
        actor_id: admin_id,
        action: 'GENERATE_REPORT',
        target_entity: 'report_orders',
        target_entity_id: 'bulk',
        reason: 'Admin generated orders report'
      });
    }
    return ReportsRepository.getOrdersReport(startDate, endDate);
  }

  static async getRevenueReport(startDate?: string, endDate?: string, admin_id?: string) {
    if (admin_id) {
      await CrmRepository.createAuditLog({
        actor_id: admin_id,
        action: 'GENERATE_REPORT',
        target_entity: 'report_revenue',
        target_entity_id: 'bulk',
        reason: 'Admin generated revenue report'
      });
    }
    return ReportsRepository.getRevenueReport(startDate, endDate);
  }

  static async getChefEarningsReport(period: 'daily' | 'weekly' | 'monthly' = 'daily', filters?: any, admin_id?: string) {
    if (admin_id) {
      await CrmRepository.createAuditLog({
        actor_id: admin_id,
        action: 'GENERATE_REPORT',
        target_entity: `report_chef_earnings_${period}`,
        target_entity_id: 'bulk',
        reason: `Admin generated chef ${period} earnings report`
      });
    }
    return ReportsRepository.getChefEarningsReport(period, filters);
  }

  static async getChefEarningsOverview(kitchen_id: string) {
    return ReportsRepository.getChefEarningsOverview(kitchen_id);
  }

  static async getChefOrders(kitchen_id: string, date?: string) {
    return ReportsRepository.getChefOrders(kitchen_id, date);
  }

  static async getExecutiveFinanceSummary() {
    return ReportsRepository.getExecutiveFinanceSummary();
  }

  static async getSocietyPerformanceReport(filters?: any) {
    return ReportsRepository.getSocietyPerformanceReport(filters);
  }

  static async getRefundReport(period: 'daily' | 'weekly' | 'monthly' = 'daily', admin_id?: string) {
    if (admin_id) {
      await CrmRepository.createAuditLog({
        actor_id: admin_id,
        action: 'GENERATE_REPORT',
        target_entity: `report_refunds_${period}`,
        target_entity_id: 'bulk',
        reason: `Admin generated ${period} refund & adjustment report`,
      });
    }
    return ReportsRepository.getRefundReport(period);
  }
}

