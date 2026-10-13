import AsyncStorage from '@react-native-async-storage/async-storage';
import { walletFinanceApi } from '../api';
import { useWalletStore } from '../store/useWalletStore';

const WALLET_CACHE_KEY = 'societychef_wallet_cache';

export class WalletRepository {
  static async fetchSummary(): Promise<void> {
    const store = useWalletStore.getState();
    try {
      const data = await walletFinanceApi.getWalletSummary();
      if (data) {
        store.setSummary(data);
        await AsyncStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(data));
      }
    } catch (e: any) {
      console.warn('[WalletRepository] Fetch online failed, loading cached wallet summary:', e.message);
      const cached = await this.getCachedSummary();
      if (cached) store.setSummary(cached);
    }
  }

  static async getCachedSummary(): Promise<any | null> {
    try {
      const raw = await AsyncStorage.getItem(WALLET_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export default WalletRepository;
