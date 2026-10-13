import { AnalyticsRepository } from '../repositories/analytics.repository';

export class AnalyticsService {
  static async getOverview(start_date?: string, end_date?: string, society_id?: string) {
    return AnalyticsRepository.getOverview(start_date, end_date, society_id);
  }

  static async getTopChefs(limit?: number, sort_by?: string) {
    return AnalyticsRepository.getTopChefs(limit, sort_by);
  }

  static async getTopKitchens(limit?: number, sort_by?: string) {
    return AnalyticsRepository.getTopKitchens(limit, sort_by);
  }

  static async getRevenueAnalytics() {
    return AnalyticsRepository.getRevenueAnalytics();
  }

  static async getPaymentAnalytics() {
    return AnalyticsRepository.getPaymentAnalytics();
  }

  static async getSettlementAnalytics() {
    return AnalyticsRepository.getSettlementAnalytics();
  }

  static async getRefundAnalytics() {
    return AnalyticsRepository.getRefundAnalytics();
  }
}

