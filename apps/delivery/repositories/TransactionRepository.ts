import AsyncStorage from '@react-native-async-storage/async-storage';
import { walletFinanceApi } from '../api';
import { useTransactionStore } from '../store/useTransactionStore';

const TXN_CACHE_KEY = 'societychef_transactions_cache';

export class TransactionRepository {
  static async fetchTransactions(): Promise<void> {
    const store = useTransactionStore.getState();
    try {
      const data = await walletFinanceApi.getTransactionFeed(store.filterType, store.searchQuery);
      if (data) {
        store.fetchTransactions();
        await AsyncStorage.setItem(TXN_CACHE_KEY, JSON.stringify(data));
      }
    } catch (e: any) {
      console.warn('[TransactionRepository] Fetch failed, loading cached transaction feed:', e.message);
      const cached = await this.getCachedTransactions();
      if (cached) {
        useTransactionStore.setState({ transactionsList: cached });
      }
    }
  }

  static async getCachedTransactions(): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(TXN_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export default TransactionRepository;
