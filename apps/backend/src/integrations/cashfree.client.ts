import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface CashfreeCustomerDetails {
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
}

export interface CashfreeOrderMeta {
  return_url: string;
  notify_url?: string;
  payment_methods?: string;
}

export interface CreateOrderPayload {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: CashfreeCustomerDetails;
  order_meta: CashfreeOrderMeta;
  order_note?: string;
  order_tags?: Record<string, string>;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  entity: string;
  order_currency: string;
  order_amount: number;
  order_status: 'ACTIVE' | 'PAID' | 'EXPIRED';
  payment_session_id: string;
  order_expiry_time?: string;
  order_note?: string;
  checkout_url: string;
}

export interface CashfreePaymentEntity {
  cf_payment_id: string;
  order_id: string;
  entity: string;
  payment_currency: string;
  payment_amount: number;
  payment_time: string;
  payment_status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED' | 'CANCELLED';
  payment_message?: string;
  bank_reference?: string;
  auth_id?: string;
  payment_method?: Record<string, any>;
  payment_group?: string;
}

export interface CreateRefundPayload {
  refund_amount: number;
  refund_id: string;
  refund_note?: string;
  refund_speed?: 'STANDARD' | 'INSTANT';
}

export interface CashfreeRefundResponse {
  cf_refund_id: string;
  refund_id: string;
  order_id: string;
  entity: string;
  refund_amount: number;
  refund_currency: string;
  refund_status: 'SUCCESS' | 'PENDING' | 'CANCELLED' | 'FAILED';
  refund_note?: string;
  created_at: string;
  processed_at?: string;
}

export class CashfreeClient {
  private static getBaseUrl(): string {
    const isProd = env.CASHFREE_ENV === 'PRODUCTION';
    return isProd
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  public static getCheckoutBaseUrl(): string {
    const isProd = env.CASHFREE_ENV === 'PRODUCTION';
    return isProd
      ? 'https://payments.cashfree.com'
      : 'https://payments-test.cashfree.com';
  }

  public static isConfigured(): boolean {
    return Boolean(env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY);
  }

  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01',
      'x-client-id': env.CASHFREE_APP_ID || '',
      'x-client-secret': env.CASHFREE_SECRET_KEY || '',
    };
  }

  /**
   * Creates an order with Cashfree Payment Gateway to generate payment_session_id
   */
  public static async createOrder(payload: CreateOrderPayload): Promise<CashfreeOrderResponse> {
    if (!this.isConfigured()) {
      logger.warn('[CashfreeClient] CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not configured. Running in mock fallback mode.');
      const mockSessionId = `session_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return {
        cf_order_id: `cf_mock_${Date.now()}`,
        order_id: payload.order_id,
        entity: 'order',
        order_currency: payload.order_currency,
        order_amount: payload.order_amount,
        order_status: 'ACTIVE',
        payment_session_id: mockSessionId,
        checkout_url: `${this.getCheckoutBaseUrl()}/order/#${mockSessionId}`,
      };
    }

    const url = `${this.getBaseUrl()}/orders`;
    logger.info('[CashfreeClient] Creating order:', { order_id: payload.order_id, amount: payload.order_amount });

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.error('[CashfreeClient] Order creation failed:', data);
      const errMsg = (data as any)?.message || response.statusText || 'Cashfree Order Creation Failed';
      throw new Error(`Cashfree Error: ${errMsg}`);
    }

    const orderRes = data as CashfreeOrderResponse;
    orderRes.checkout_url = `${this.getCheckoutBaseUrl()}/order/#${orderRes.payment_session_id}`;
    return orderRes;
  }

  /**
   * Fetches order details and status from Cashfree
   */
  public static async getOrder(orderId: string): Promise<CashfreeOrderResponse> {
    if (!this.isConfigured()) {
      return {
        cf_order_id: `cf_mock_${orderId}`,
        order_id: orderId,
        entity: 'order',
        order_currency: 'INR',
        order_amount: 0,
        order_status: 'PAID',
        payment_session_id: `session_mock_${orderId}`,
        checkout_url: '',
      };
    }

    const url = `${this.getBaseUrl()}/orders/${orderId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.error(`[CashfreeClient] Failed to fetch order ${orderId}:`, data);
      throw new Error((data as any)?.message || 'Failed to fetch Cashfree order status');
    }

    return data as CashfreeOrderResponse;
  }

  /**
   * Fetches all payment attempts and transactions for a Cashfree order
   */
  public static async getOrderPayments(orderId: string): Promise<CashfreePaymentEntity[]> {
    if (!this.isConfigured()) {
      return [{
        cf_payment_id: `cf_pay_mock_${Date.now()}`,
        order_id: orderId,
        entity: 'payment',
        payment_currency: 'INR',
        payment_amount: 0,
        payment_time: new Date().toISOString(),
        payment_status: 'SUCCESS',
        payment_group: 'upi',
      }];
    }

    const url = `${this.getBaseUrl()}/orders/${orderId}/payments`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json().catch(() => ([]));

    if (!response.ok) {
      logger.error(`[CashfreeClient] Failed to fetch payments for order ${orderId}:`, data);
      throw new Error((data as any)?.message || 'Failed to fetch Cashfree order payments');
    }

    return Array.isArray(data) ? (data as CashfreePaymentEntity[]) : [];
  }

  /**
   * Initiates a refund via Cashfree PG Refund API
   */
  public static async createRefund(orderId: string, payload: CreateRefundPayload): Promise<CashfreeRefundResponse> {
    if (!this.isConfigured()) {
      return {
        cf_refund_id: `cf_ref_mock_${Date.now()}`,
        refund_id: payload.refund_id,
        order_id: orderId,
        entity: 'refund',
        refund_amount: payload.refund_amount,
        refund_currency: 'INR',
        refund_status: 'SUCCESS',
        created_at: new Date().toISOString(),
      };
    }

    const url = `${this.getBaseUrl()}/orders/${orderId}/refunds`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.error(`[CashfreeClient] Refund failed for order ${orderId}:`, data);
      throw new Error((data as any)?.message || 'Cashfree Refund Failed');
    }

    return data as CashfreeRefundResponse;
  }
}
