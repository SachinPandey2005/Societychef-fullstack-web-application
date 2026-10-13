import { walletFinanceApi } from '../api';
import { useEarningsStore } from '../store/useEarningsStore';

export class EarningsRepository {
  static async fetchEarningsBreakdown(): Promise<void> {
    const store = useEarningsStore.getState();
    await store.fetchEarnings();
  }

  static async getOrderEarningDetail(orderId: string): Promise<any> {
    try {
      return await walletFinanceApi.getOrderEarningDetail(orderId);
    } catch (e: any) {
      console.warn('[EarningsRepository] Get order earning detail fallback:', e.message);
      return null;
    }
  }
}

export default EarningsRepository;
