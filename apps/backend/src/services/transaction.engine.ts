import { WalletRepository } from '../repositories/wallet.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { ValidationError } from '../utils/errors';

export interface TransactionPayload {
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  amount: number;
  currency?: string;
  transaction_type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'REVERSAL' | 'ADJUSTMENT';
  source: string;
  reference_id?: string;
  order_id?: string;
  payment_id?: string;
  description: string;
}

export class TransactionEngine {
  static async execute(payload: TransactionPayload) {
    if (!payload.from_wallet_id && !payload.to_wallet_id) {
      throw new ValidationError('Transaction must have at least one valid wallet.');
    }

    if (payload.amount <= 0) {
      throw new ValidationError('Transaction amount must be strictly positive.');
    }

    try {
      const result = await WalletRepository.executeFinancialTransaction({
        from_wallet_id: payload.from_wallet_id,
        to_wallet_id: payload.to_wallet_id,
        amount: payload.amount,
        currency: payload.currency || 'INR',
        transaction_type: payload.transaction_type,
        source: payload.source,
        reference_id: payload.reference_id || null,
        order_id: payload.order_id || null,
        payment_id: payload.payment_id || null,
        description: payload.description,
      });

      // Emit Events
      if (payload.transaction_type === 'HOLD') {
        internalEventBus.emit(EVENTS.FUNDS_HELD, { payload, result });
      } else if (payload.transaction_type === 'RELEASE') {
        internalEventBus.emit(EVENTS.FUNDS_RELEASED, { payload, result });
      } else {
        if (payload.from_wallet_id) {
          internalEventBus.emit(EVENTS.WALLET_DEBITED, { wallet_id: payload.from_wallet_id, amount: payload.amount, result });
        }
        if (payload.to_wallet_id) {
          internalEventBus.emit(EVENTS.WALLET_CREDITED, { wallet_id: payload.to_wallet_id, amount: payload.amount, result });
        }
      }

      internalEventBus.emit(EVENTS.TRANSACTION_COMPLETED, { payload, result });
      
      return result;
    } catch (error: any) {
      internalEventBus.emit(EVENTS.TRANSACTION_FAILED, { payload, error: error.message });
      throw new Error(`TransactionEngine Error: ${error.message}`);
    }
  }
}
