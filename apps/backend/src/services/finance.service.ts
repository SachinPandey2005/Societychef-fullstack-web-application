import { FinanceRepository } from '../repositories/finance.repository';

export class FinanceService {
  static async getOverview() {
    return FinanceRepository.getFinanceOverview();
  }
}
