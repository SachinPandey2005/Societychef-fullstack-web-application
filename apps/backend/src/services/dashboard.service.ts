import { DashboardRepository } from '../repositories/dashboard.repository';
import { DateRangeOption } from '../types/dashboard';

export class DashboardService {
  static async getOverview() {
    return DashboardRepository.getOverviewStats();
  }

  static parseDateRange(range?: DateRangeOption, startDateParam?: string, endDateParam?: string): { startDate: string; endDate: string } {
    const now = new Date();
    let end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const option = range || '30days';

    switch (option) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        break;
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        end.setTime(lastDay.getTime());
        break;
      case 'custom':
        if (startDateParam) start = new Date(startDateParam);
        if (endDateParam) end = new Date(endDateParam);
        break;
      default:
        start.setDate(start.getDate() - 30);
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  static async getFinanceSummary(range?: DateRangeOption, startDate?: string, endDate?: string) {
    const dates = this.parseDateRange(range, startDate, endDate);
    return DashboardRepository.getFinanceSummary(dates.startDate, dates.endDate);
  }

  static async getRevenueAnalytics(range?: DateRangeOption, startDate?: string, endDate?: string) {
    const dates = this.parseDateRange(range, startDate, endDate);
    return DashboardRepository.getRevenueAnalytics(dates.startDate, dates.endDate);
  }

  static async getOrdersSummary(range?: DateRangeOption, startDate?: string, endDate?: string) {
    const dates = this.parseDateRange(range, startDate, endDate);
    return DashboardRepository.getOrdersSummary(dates.startDate, dates.endDate);
  }

  static async getPaymentSummary(range?: DateRangeOption, startDate?: string, endDate?: string) {
    const dates = this.parseDateRange(range, startDate, endDate);
    return DashboardRepository.getPaymentSummary(dates.startDate, dates.endDate);
  }

  static async getSettlementsSummary(range?: DateRangeOption, startDate?: string, endDate?: string) {
    const dates = this.parseDateRange(range, startDate, endDate);
    return DashboardRepository.getSettlementsSummary(dates.startDate, dates.endDate);
  }

  static async getTopChefs(limit = 5, range?: DateRangeOption, startDate?: string, endDate?: string) {
    const dates = this.parseDateRange(range, startDate, endDate);
    return DashboardRepository.getTopChefs(limit, dates.startDate, dates.endDate);
  }

  static async getTopSocieties(limit = 5, range?: DateRangeOption, startDate?: string, endDate?: string) {
    const dates = this.parseDateRange(range, startDate, endDate);
    return DashboardRepository.getTopSocieties(limit, dates.startDate, dates.endDate);
  }

  static async getRecentFinancialActivity(limit = 10) {
    return DashboardRepository.getRecentFinancialActivity(limit);
  }

  static async getPerformanceMetrics(range?: DateRangeOption, startDate?: string, endDate?: string) {
    const dates = this.parseDateRange(range, startDate, endDate);
    return DashboardRepository.getPerformanceMetrics(dates.startDate, dates.endDate);
  }
}
