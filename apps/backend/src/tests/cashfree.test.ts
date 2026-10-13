import crypto from 'crypto';
import { CashfreeService } from '../services/cashfree.service';
import { CashfreeClient } from '../integrations/cashfree.client';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../repositories/order.repository';
import { SettlementService } from '../services/settlement.service';
import { NotificationService } from '../services/notification.service';
import { env } from '../config/env';

// Mocks
jest.mock('../integrations/cashfree.client');
jest.mock('../repositories/payment.repository');
jest.mock('../repositories/order.repository');
jest.mock('../services/settlement.service');
jest.mock('../services/notification.service');
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe('Cashfree Payment Gateway Integration', () => {
  const secret = 'mock_cf_secret_key_12345';
  const consumerId = '11111111-1111-1111-1111-111111111111';
  const orderId = '22222222-2222-2222-2222-222222222222';

  beforeAll(() => {
    (env as any).CASHFREE_SECRET_KEY = secret;
    (env as any).CASHFREE_APP_ID = 'mock_cf_app_id';
    (env as any).CASHFREE_ENV = 'SANDBOX';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook Signature & Replay Protection', () => {
    function generateValidSignature(body: string, timestamp: string, key = secret) {
      return crypto.createHmac('sha256', key).update(timestamp + body).digest('base64');
    }

    it('verifies valid HMAC-SHA256 signature with current timestamp', () => {
      const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'cf_123' } } });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = generateValidSignature(body, timestamp);

      const isValid = CashfreeService.verifyWebhookSignature(body, signature, timestamp);
      expect(isValid).toBe(true);
    });

    it('rejects tampered signature', () => {
      const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'cf_123' } } });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const invalidSignature = Buffer.from('invalid_signature').toString('base64');

      const isValid = CashfreeService.verifyWebhookSignature(body, invalidSignature, timestamp);
      expect(isValid).toBe(false);
    });

    it('rejects tampered request body', () => {
      const originalBody = JSON.stringify({ amount: 100 });
      const tamperedBody = JSON.stringify({ amount: 999 });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = generateValidSignature(originalBody, timestamp);

      const isValid = CashfreeService.verifyWebhookSignature(tamperedBody, signature, timestamp);
      expect(isValid).toBe(false);
    });

    it('rejects stale webhook timestamp older than 5 minutes (replay attack guard)', async () => {
      const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' });
      // 10 minutes in the past
      const oldTimestamp = Math.floor((Date.now() - 10 * 60 * 1000) / 1000).toString();
      const signature = generateValidSignature(body, oldTimestamp);

      await expect(
        CashfreeService.handleWebhookEvent(body, signature, oldTimestamp)
      ).rejects.toThrow(/Replay attack detected/i);
    });

    it('rejects future webhook timestamp beyond 5 minutes', async () => {
      const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' });
      // 10 minutes in future
      const futureTimestamp = Math.floor((Date.now() + 10 * 60 * 1000) / 1000).toString();
      const signature = generateValidSignature(body, futureTimestamp);

      await expect(
        CashfreeService.handleWebhookEvent(body, signature, futureTimestamp)
      ).rejects.toThrow(/Replay attack detected/i);
    });
  });

  describe('Order Creation Flow', () => {
    it('creates a Cashfree order and persists pending payment record', async () => {
      (OrderRepository.getOrderById as jest.Mock).mockResolvedValue({
        id: orderId,
        profile_id: consumerId,
        grand_total: 450,
        order_code: 'HC-1234',
        payment_status: 'pending',
      });

      (PaymentRepository.findByInternalOrderId as jest.Mock).mockResolvedValue([]);

      (CashfreeClient.createOrder as jest.Mock).mockResolvedValue({
        cf_order_id: 'cf_order_test_123',
        payment_session_id: 'session_xyz123',
        order_status: 'ACTIVE',
        order_amount: 450,
        order_currency: 'INR',
        checkout_url: 'https://sandbox.cashfree.com/pg/orders/cf_order_test_123',
      });

      (PaymentRepository.createPayment as jest.Mock).mockResolvedValue({
        id: 'pay-uuid-1',
        order_id: orderId,
        consumer_id: consumerId,
        amount: 450,
        payment_status: 'PENDING',
        payment_gateway: 'CASHFREE',
        cf_order_id: 'cf_order_test_123',
        payment_session_id: 'session_xyz123',
      });

      const result = await CashfreeService.createCashfreeOrder(consumerId, orderId, {
        name: 'Test Customer',
        phone: '9876543210',
      });

      expect(result).toBeDefined();
      expect(result.cf_order_id).toBe('cf_order_test_123');
      expect(result.payment_session_id).toBe('session_xyz123');
      expect(result.checkout_url).toBe('https://sandbox.cashfree.com/pg/orders/cf_order_test_123');
      expect(CashfreeClient.createOrder).toHaveBeenCalledTimes(1);
      expect(PaymentRepository.createPayment).toHaveBeenCalledTimes(1);
    });
  });

  describe('Order Verification Flow & Idempotency', () => {
    it('verifies paid Cashfree order and updates order status with settlement', async () => {
      const mockPayment: any = {
        id: 'pay-uuid-1',
        order_id: orderId,
        consumer_id: consumerId,
        amount: 450,
        payment_status: 'PENDING',
        cf_order_id: 'cf_order_test_123',
        metadata: { associated_order_ids: [orderId] },
      };

      (PaymentRepository.findByCfOrderId as jest.Mock).mockResolvedValue(mockPayment);
      (CashfreeClient.getOrder as jest.Mock).mockResolvedValue({
        cf_order_id: 'cf_order_test_123',
        order_status: 'PAID',
        order_amount: 450,
      });
      (CashfreeClient.getOrderPayments as jest.Mock).mockResolvedValue([
        {
          cf_payment_id: 'cf_pay_999',
          payment_status: 'SUCCESS',
          payment_amount: 450,
          payment_group: 'UPI',
          payment_time: new Date().toISOString(),
        },
      ]);
      (PaymentRepository.updatePaymentRecord as jest.Mock).mockResolvedValue({
        ...mockPayment,
        payment_status: 'CAPTURED',
        cf_payment_id: 'cf_pay_999',
      });

      const result = await CashfreeService.verifyCashfreeOrder(consumerId, orderId, 'cf_order_test_123');

      expect(result.success).toBe(true);
      expect(PaymentRepository.updatePaymentRecord).toHaveBeenCalledWith(
        'pay-uuid-1',
        expect.objectContaining({
          payment_status: 'CAPTURED',
          cf_payment_id: 'cf_pay_999',
        })
      );
      expect(SettlementService.processAutomaticOrderSettlement).toHaveBeenCalledWith(orderId, 'pay-uuid-1');
    });

    it('returns already_captured immediately if payment record is already CAPTURED (Idempotency)', async () => {
      const mockPayment: any = {
        id: 'pay-uuid-1',
        order_id: orderId,
        consumer_id: consumerId,
        amount: 450,
        payment_status: 'CAPTURED',
        cf_order_id: 'cf_order_test_123',
      };

      (PaymentRepository.findByCfOrderId as jest.Mock).mockResolvedValue(mockPayment);

      const result = await CashfreeService.verifyCashfreeOrder(consumerId, orderId, 'cf_order_test_123');

      expect(result.success).toBe(true);
      expect(result.already_captured).toBe(true);
      expect(CashfreeClient.getOrder).not.toHaveBeenCalled();
      expect(PaymentRepository.updatePaymentRecord).not.toHaveBeenCalled();
    });
  });

  describe('Webhook Event Handling', () => {
    it('handles PAYMENT_SUCCESS_WEBHOOK, captures payment, and logs webhook event', async () => {
      const rawPayload = JSON.stringify({
        type: 'PAYMENT_SUCCESS_WEBHOOK',
        event_time: new Date().toISOString(),
        data: {
          order: { order_id: 'cf_order_webhook_1' },
          payment: {
            cf_payment_id: 'cf_pay_wh_1',
            payment_status: 'SUCCESS',
            payment_amount: 500,
            payment_group: 'UPI',
            payment_time: new Date().toISOString(),
          },
        },
      });

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto.createHmac('sha256', secret).update(timestamp + rawPayload).digest('base64');

      (PaymentRepository.findWebhookEvent as jest.Mock).mockResolvedValue(null);

      const mockPayment: any = {
        id: 'pay-uuid-wh-1',
        order_id: orderId,
        consumer_id: consumerId,
        amount: 500,
        payment_status: 'PENDING',
        cf_order_id: 'cf_order_webhook_1',
        metadata: { associated_order_ids: [orderId] },
      };
      (PaymentRepository.findByCfOrderId as jest.Mock).mockResolvedValue(mockPayment);
      (PaymentRepository.updatePaymentRecord as jest.Mock).mockResolvedValue({
        ...mockPayment,
        payment_status: 'CAPTURED',
      });

      const res = await CashfreeService.handleWebhookEvent(rawPayload, signature, timestamp);

      expect(res.ok).toBe(true);
      expect(PaymentRepository.recordWebhookEvent).toHaveBeenCalled();
      expect(PaymentRepository.updatePaymentRecord).toHaveBeenCalledWith(
        'pay-uuid-wh-1',
        expect.objectContaining({
          payment_status: 'CAPTURED',
          cf_payment_id: 'cf_pay_wh_1',
        })
      );
    });

    it('ignores duplicate webhook event if already recorded (Idempotency)', async () => {
      const rawPayload = JSON.stringify({
        type: 'PAYMENT_SUCCESS_WEBHOOK',
        data: { order: { order_id: 'cf_order_dup' }, payment: { cf_payment_id: 'pay_dup' } },
      });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto.createHmac('sha256', secret).update(timestamp + rawPayload).digest('base64');

      (PaymentRepository.findWebhookEvent as jest.Mock).mockResolvedValue({
        id: 'evt-123',
        event_id: 'cf_order_dup_pay_dup',
        status: 'PROCESSED',
      });

      const res = await CashfreeService.handleWebhookEvent(rawPayload, signature, timestamp);

      expect(res.ok).toBe(true);
      expect(res.duplicate).toBe(true);
      expect(PaymentRepository.updatePaymentRecord).not.toHaveBeenCalled();
    });

    it('does not downgrade CAPTURED payment on late failure webhook', async () => {
      const rawPayload = JSON.stringify({
        type: 'PAYMENT_FAILED_WEBHOOK',
        data: {
          order: { order_id: 'cf_order_already_paid' },
          payment: { cf_payment_id: 'pay_fail', payment_status: 'FAILED' },
        },
      });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto.createHmac('sha256', secret).update(timestamp + rawPayload).digest('base64');

      (PaymentRepository.findWebhookEvent as jest.Mock).mockResolvedValue(null);
      (PaymentRepository.findByCfOrderId as jest.Mock).mockResolvedValue({
        id: 'pay-uuid-paid',
        payment_status: 'CAPTURED',
        cf_order_id: 'cf_order_already_paid',
      });

      const res = await CashfreeService.handleWebhookEvent(rawPayload, signature, timestamp);

      expect(res.ok).toBe(true);
      expect(res.ignored).toBe(true);
      expect(PaymentRepository.updatePaymentRecord).not.toHaveBeenCalled();
    });
  });

  describe('Refund Flow', () => {
    it('creates refund with Cashfree PG client and updates payment record', async () => {
      const capturedPayment: any = {
        id: 'pay-uuid-ref',
        order_id: orderId,
        payment_status: 'CAPTURED',
        cf_order_id: 'cf_order_ref_1',
        amount: 300,
      };

      (PaymentRepository.findByInternalOrderId as jest.Mock).mockResolvedValue([capturedPayment]);
      (CashfreeClient.createRefund as jest.Mock).mockResolvedValue({
        cf_refund_id: 'cf_ref_777',
        refund_id: 'ref_123',
        refund_status: 'SUCCESS',
        refund_amount: 300,
      });

      const refundResult = await CashfreeService.refundCashfreePayment(orderId, 300, 'Customer order cancelled');

      expect(refundResult.refund_status).toBe('SUCCESS');
      expect(CashfreeClient.createRefund).toHaveBeenCalledWith(
        'cf_order_ref_1',
        expect.objectContaining({
          refund_amount: 300,
          refund_note: 'Customer order cancelled',
        })
      );
      expect(PaymentRepository.updatePaymentRecord).toHaveBeenCalledWith(
        'pay-uuid-ref',
        expect.objectContaining({
          refund_status: 'SUCCESS',
          payment_status: 'REFUNDED',
        })
      );
    });
  });
});
