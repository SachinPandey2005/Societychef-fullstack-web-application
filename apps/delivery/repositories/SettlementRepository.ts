import { walletFinanceApi } from '../api';
import { useSettlementStore, SettlementTabType } from '../store/useSettlementStore';

export class SettlementRepository {
  static async fetchSettlements(tab?: SettlementTabType): Promise<void> {
    const store = useSettlementStore.getState();
    await store.fetchSettlements(tab);
  }

  static async getSettlementDetail(id: string): Promise<any> {
    try {
      return await walletFinanceApi.getSettlementDetail(id);
    } catch (e: any) {
      console.warn('[SettlementRepository] Get detail fallback:', e.message);
      return null;
    }
  }
}

export default SettlementRepository;
