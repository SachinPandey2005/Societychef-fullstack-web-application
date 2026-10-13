import { WalletRepository } from '../repositories/wallet.repository';
import { TransactionEngine } from './transaction.engine';
import { WalletOwnerType } from '../types/wallet';

export class WalletService {
  static async getWallet(user_id: string | null, wallet_type: WalletOwnerType) {
    return WalletRepository.getWallet(user_id, wallet_type);
  }

  static async creditWallet(user_id: string | null, wallet_type: WalletOwnerType, amount: number, source: string, description: string, reference_id?: string) {
    const wallet = await this.getWallet(user_id, wallet_type);
    
    return TransactionEngine.execute({
      from_wallet_id: null, // External source
      to_wallet_id: wallet.id,
      amount,
      transaction_type: 'CREDIT',
      source,
      description,
      reference_id
    });
  }

  static async debitWallet(user_id: string | null, wallet_type: WalletOwnerType, amount: number, source: string, description: string, reference_id?: string) {
    const wallet = await this.getWallet(user_id, wallet_type);
    
    return TransactionEngine.execute({
      from_wallet_id: wallet.id,
      to_wallet_id: null, // External sink
      amount,
      transaction_type: 'DEBIT',
      source,
      description,
      reference_id
    });
  }

  static async transferBalance(from_user_id: string | null, from_type: WalletOwnerType, to_user_id: string | null, to_type: WalletOwnerType, amount: number, source: string, description: string, reference_id?: string) {
    const from_wallet = await this.getWallet(from_user_id, from_type);
    const to_wallet = await this.getWallet(to_user_id, to_type);

    return TransactionEngine.execute({
      from_wallet_id: from_wallet.id,
      to_wallet_id: to_wallet.id,
      amount,
      transaction_type: 'CREDIT', // Type viewed from receiver, or could be 'ADJUSTMENT'
      source,
      description,
      reference_id
    });
  }

  static async holdAmount(user_id: string | null, wallet_type: WalletOwnerType, amount: number, source: string, description: string, reference_id?: string) {
    const wallet = await this.getWallet(user_id, wallet_type);
    
    return TransactionEngine.execute({
      from_wallet_id: wallet.id,
      to_wallet_id: null,
      amount,
      transaction_type: 'HOLD',
      source,
      description,
      reference_id
    });
  }

  static async getTransactions(wallet_id: string, limit?: number, offset?: number) {
    return WalletRepository.getTransactions(wallet_id, limit, offset);
  }
}
