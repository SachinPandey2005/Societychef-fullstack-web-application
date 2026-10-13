import { walletFinanceApi } from '../api';
import { useBankStore, BankDetails } from '../store/useBankStore';

export class BankRepository {
  static async updateDetails(details: Partial<BankDetails>): Promise<void> {
    const store = useBankStore.getState();
    await store.updateBankDetails(details);
  }
}

export default BankRepository;
