import { logger } from '../utils/logger';

export interface PaymentProvider {
  processPayment(amount: number, currency: string): Promise<any>;
}

export interface LocationProvider {
  getDistance(origin: string, destination: string): Promise<number>;
}

export class ProviderRegistry {
  private static paymentProvider: PaymentProvider;
  private static locationProvider: LocationProvider;

  /**
   * Stage 2 & 5-11: Provider Abstraction Registry
   * Registers a concrete implementation dynamically.
   */
  static registerPaymentProvider(provider: PaymentProvider) {
    logger.info('Payment Provider registered');
    this.paymentProvider = provider;
  }

  static getPaymentProvider(): PaymentProvider {
    if (!this.paymentProvider) throw new Error('No Payment Provider registered');
    return this.paymentProvider;
  }
}
