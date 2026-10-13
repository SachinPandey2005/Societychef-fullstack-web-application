import * as WebBrowser from 'expo-web-browser';
import apiClient from '../lib/apiClient';
import { useAuthStore } from '../store/useAuthStore';

// Complete auth session if redirected back in web
try {
  WebBrowser.maybeCompleteAuthSession();
} catch {}

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'COD';

export type PaymentResult = {
  success: boolean;
  paymentId: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  timestamp: string;
  error?: string;
};

export type SettlementBreakdown = {
  grossSales: number;
  platformFee: number; // 10%
  gatewayFee: number;  // 2%
  totalDeductions: number;
  netPayout: number;
};

/**
 * Calculates net chef payout subtracting 10% platform fee and 2% payment gateway overheads.
 */
export function calculateSettlementBreakdown(grossSales: number): SettlementBreakdown {
  const platformFee = Math.round(grossSales * 0.10);
  const gatewayFee  = Math.round(grossSales * 0.02);
  const totalDeductions = platformFee + gatewayFee;
  const netPayout = Math.max(0, grossSales - totalDeductions);

  return {
    grossSales,
    platformFee,
    gatewayFee,
    totalDeductions,
    netPayout,
  };
}

export interface InitiateCashfreePaymentParams {
  orderId: string;
  amount: number;
  associatedOrderIds?: string[];
  method?: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

/**
 * Initiates a real Cashfree Payment Gateway transaction.
 * 1. Calls backend /payments/cashfree/create-order to create order and get payment session / checkout url
 * 2. Launches Expo WebBrowser auth session for Cashfree hosted checkout
 * 3. Calls backend /payments/cashfree/verify to verify payment status and update DB
 */
export async function initiateCashfreePayment(params: InitiateCashfreePaymentParams): Promise<PaymentResult> {
  const user = useAuthStore.getState().user;
  const customerName = params.customerName || user?.displayName || 'Rasohi Customer';
  const customerPhone = params.customerPhone || user?.phone || '9999999999';

  try {
    // 1. Create Cashfree Order on Backend
    const createRes = await apiClient.post('/payments/cashfree/create-order', {
      order_id: params.orderId,
      amount: params.amount,
      associated_order_ids: params.associatedOrderIds,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: params.customerEmail,
    });

    const cfOrder = createRes?.data;
    if (!cfOrder || !cfOrder.cf_order_id) {
      throw new Error(createRes?.message || 'Failed to initialize Cashfree payment order');
    }

    const checkoutUrl = cfOrder.checkout_url;
    if (!checkoutUrl) {
      throw new Error('No checkout URL returned by Cashfree');
    }

    // 2. Open Cashfree Hosted Checkout via WebBrowser
    const returnUrl = 'rasohi://payment-return';
    await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

    // 3. Verify Payment Status with Backend
    // Regardless of whether browser returned 'success' or was closed, we verify with Cashfree PG
    const verifyRes = await apiClient.post('/payments/cashfree/verify', {
      order_id: params.orderId,
      cf_order_id: cfOrder.cf_order_id,
    });

    const isSuccess = verifyRes?.data?.success === true;
    const paymentRecord = verifyRes?.data?.payment;

    return {
      success: isSuccess,
      paymentId: paymentRecord?.cf_payment_id || cfOrder.cf_order_id,
      orderId: params.orderId,
      method: (paymentRecord?.payment_method as PaymentMethod) || params.method || 'UPI',
      amount: params.amount,
      currency: 'INR',
      timestamp: paymentRecord?.payment_timestamp || new Date().toISOString(),
      error: isSuccess ? undefined : (verifyRes?.data?.message || 'Payment not completed'),
    };
  } catch (error: any) {
    console.error('[Cashfree] Payment initiation or verification error:', error);
    return {
      success: false,
      paymentId: '',
      orderId: params.orderId,
      method: params.method || 'UPI',
      amount: params.amount,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      error: error?.message || 'Payment initiation failed',
    };
  }
}

/**
 * Backwards-compatible alias for initiateRazorpayPayment.
 * Routes directly to initiateCashfreePayment.
 */
export const initiateRazorpayPayment = initiateCashfreePayment;
