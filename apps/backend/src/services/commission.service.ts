import { CommissionRepository } from '../repositories/commission.repository';
import { CommissionEngine } from './commission.engine';
import { CreateCommissionRuleInput, UpdateCommissionRuleInput } from '../types/commission';

export class CommissionService {
  static async getAllRules() {
    return CommissionRepository.getAllRules();
  }

  static async getRuleById(id: string) {
    return CommissionRepository.getRuleById(id);
  }

  static async createRule(payload: CreateCommissionRuleInput) {
    return CommissionRepository.createRule(payload);
  }

  static async updateRule(id: string, payload: UpdateCommissionRuleInput) {
    return CommissionRepository.updateRule(id, payload);
  }

  static async deleteRule(id: string) {
    return CommissionRepository.deleteRule(id);
  }

  static async calculateOrderCommission(
    orderId: string,
    grandTotal: number,
    deliveryFee: number,
    kitchenId: string,
    societyId?: string
  ) {
    return CommissionEngine.calculateOrderFinancials(orderId, grandTotal, deliveryFee, kitchenId, societyId);
  }
}
