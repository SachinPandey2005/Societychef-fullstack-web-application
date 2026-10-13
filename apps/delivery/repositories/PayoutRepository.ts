import { walletFinanceApi } from '../api';
import { usePayoutStore } from '../store/usePayoutStore';

export class PayoutRepository {
  static async fetchPayoutHistory(): Promise<void> {
    const store = usePayoutStore.getState();
    await store.fetchPayoutHistory();
  }

  static async requestInstantPayout(amount: number): Promise<void> {
    const store = usePayoutStore.getState();
    await store.requestInstantPayout(amount);
  }
}

export default PayoutRepository;
