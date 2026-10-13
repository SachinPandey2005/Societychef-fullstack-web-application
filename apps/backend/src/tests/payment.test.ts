import { PaymentService } from '../services/payment.service';
import { RefundService } from '../services/refund.service';
import { SettlementService } from '../services/settlement.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { RefundRepository } from '../repositories/refund.repository';
import { KitchenService } from '../services/kitchen.service';
import { WalletService } from '../services/wallet.service';
import { TransactionEngine } from '../services/transaction.engine';
import crypto from 'crypto';
import { env } from '../config/env';

// Mock Razorpay completely to avoid real network calls
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => {
    return {
      orders: {
        create: jest.fn().mockResolvedValue({
          id: 'rzp_order_mock',
          amount: 50000,
          currency: 'INR',
        }),
      },
      payments: {
        refund: jest.fn().mockResolvedValue({
          id: 'rzp_refund_mock',
        }),
      },
    };
  });
});

jest.mock('../repositories/payment.repository');
jest.mock('../repositories/order.repository');
jest.mock('../repositories/refund.repository');
jest.mock('../services/order.service');
jest.mock('../services/kitchen.service');
jest.mock('../services/wallet.service');
jest.mock('../services/transaction.engine');
jest.mock('../config/supabase', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockResolvedValue({
      data: [
        { grand_total: 1000 },
        { grand_total: 2500 }
      ]
    }),
    limit: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'o_uuid',
        grand_total: 500.00,
        total_paid: 500.00,
        customer_id: 'c_uuid',
        kitchen_id: 'k_uuid',
        razorpay_payment_id: 'rzp_pay_mock',
        net_chef_earnings: 450.00,
        kitchens: {
          chef_user_id: 'chef_uuid',
          id: 'k_uuid',
          chef_name: 'Test Chef'
        }
      },
      error: null
    }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockImplementation((resolve) => resolve({ data: [], error: null }))
  };
  return { supabase: mockSupabase };
});
jest.mock('../repositories/settlement.repository', () => ({
  SettlementRepository: {
    findSettlementByTransactionId: jest.fn().mockResolvedValue(null),
    createSettlement: jest.fn().mockResolvedValue({ id: 'set_123' }),
    updateSettlementRecord: jest.fn().mockResolvedValue({ id: 'set_123' }),
    logFinancialAudit: jest.fn().mockResolvedValue(true)
  }
}));

describe('Phase 6: Payment Verification', () => {
  const consumer_id = 'c_uuid';
  const internal_order_id = 'o_uuid';
  
  beforeAll(() => {
    env.RAZORPAY_KEY_ID = 'rzp_test_mock';
    env.RAZORPAY_KEY_SECRET = 'rzp_secret_mock';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Order Creation', () => {
    it('should create a Razorpay order correctly', async () => {
      (OrderService.getOrderById as jest.Mock).mockResolvedValue({
        id: internal_order_id,
        profile_id: consumer_id,
        status: 'PENDING',
        grand_total: 500.00
      });
      (PaymentRepository.findByInternalOrderId as jest.Mock).mockResolvedValue([]);
      (PaymentRepository.createPayment as jest.Mock).mockResolvedValue({ id: 'internal_pay_id' });

      const result = await PaymentService.createRazorpayOrder(consumer_id, internal_order_id);

      expect(result.razorpay_order_id).toBe('rzp_order_mock');
      expect(result.amount).toBe(50000);
      expect(PaymentRepository.createPayment).toHaveBeenCalledWith(expect.objectContaining({
        order_id: internal_order_id,
        amount: 50000,
        payment_status: 'PENDING'
      }));
    });
  });

  describe('2. Payment & Signature Verification', () => {
    it('should accept a valid signature', async () => {
      (PaymentRepository.findByRazorpayOrderId as jest.Mock).mockResolvedValue({
        id: 'internal_pay_id',
        order_id: internal_order_id,
        consumer_id: consumer_id
      });

      const rzp_order_id = 'rzp_order_mock';
      const rzp_pay_id = 'rzp_pay_mock';
      
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
        .update(`${rzp_order_id}|${rzp_pay_id}`)
        .digest('hex');

      await PaymentService.verifyPayment(consumer_id, rzp_order_id, rzp_pay_id, signature);

      expect(PaymentRepository.updatePaymentRecord).toHaveBeenCalledWith('internal_pay_id', expect.objectContaining({
        payment_status: 'CAPTURED'
      }));
      expect(OrderService.updateOrderStatus).toHaveBeenCalledWith(internal_order_id, 'ACCEPTED', 'consumer');
    });

    it('should reject an invalid signature', async () => {
      (PaymentRepository.findByRazorpayOrderId as jest.Mock).mockResolvedValue({
        id: 'internal_pay_id',
        order_id: internal_order_id,
        consumer_id: consumer_id
      });

      await expect(PaymentService.verifyPayment(consumer_id, 'rzp_order_mock', 'rzp_pay_mock', 'invalid_sig'))
        .rejects.toThrow('Invalid payment signature');

      expect(PaymentRepository.updatePaymentRecord).toHaveBeenCalledWith('internal_pay_id', expect.objectContaining({
        payment_status: 'FAILED'
      }));
    });
  });

  describe('3. Refund Flow (Double Entry Ledger Reversal)', () => {
    it('should process a refund and execute a ledger reversal', async () => {
      const refundId = 'refund_123';
      (RefundRepository.findById as jest.Mock).mockResolvedValue({
        id: refundId,
        order_id: internal_order_id,
        customer_id: consumer_id,
        payment_id: 'rzp_pay_mock',
        amount: 500.00
      });
      (RefundRepository.createRefund as jest.Mock).mockResolvedValue({
        id: refundId,
        order_id: internal_order_id,
        customer_id: consumer_id,
        payment_id: 'rzp_pay_mock',
        amount: 450.00
      });
      (RefundRepository.updateRefundStatus as jest.Mock).mockResolvedValue({
        id: refundId,
        order_id: internal_order_id,
        customer_id: consumer_id,
        payment_id: 'rzp_pay_mock',
        amount: 450.00
      });
      (OrderRepository.getOrderById as jest.Mock).mockResolvedValue({
        id: internal_order_id,
        kitchen_id: 'k_uuid',
        net_chef_earnings: 450.00
      });
      (KitchenService.getKitchenById as jest.Mock).mockResolvedValue({ chef_user_id: 'chef_uuid' });
      (WalletService.getWallet as jest.Mock).mockResolvedValueOnce({ id: 'chef_wallet_id' });
      (WalletService.getWallet as jest.Mock).mockResolvedValueOnce({ id: 'consumer_wallet_id' });

      // Assuming CrmService is missing from mock, let's mock it inside refund.service
      const CrmService = require('../services/crm.service').CrmService;
      CrmService.logAction = jest.fn().mockResolvedValue(true);

      await RefundService.processRefund({ order_id: refundId, amount: 450.00, reason: 'APPROVED', actor_id: 'admin_id' });

      expect(WalletService.debitWallet).toHaveBeenCalledWith(
        'chef_uuid',
        'CHEF',
        450.00,
        'REFUND_ADJUSTMENT',
        expect.any(String),
        refundId
      );
      expect(RefundRepository.createRefund).toHaveBeenCalled();
    });
  });

  describe('4. Settlement Logic Math', () => {
    it('should calculate commissions accurately without mocking math', async () => {
      const { SettlementRepository } = require('../repositories/settlement.repository');
      SettlementRepository.createSettlement = jest.fn().mockResolvedValue({ id: 'set_123' });

      await SettlementService.generateSettlement('k_uuid', '2026-07-01', '2026-07-14');

      // 1000 + 2500 = 3500 total sales
      // Platform: 350
      // Gateway: 70
      // Net: 3080
      expect(SettlementRepository.createSettlement).toHaveBeenCalledWith(expect.objectContaining({
        total_sales: 3500,
        platform_commission: 350,
        gateway_fees: 70,
        net_payable: 3080
      }));
    });
  });
});
