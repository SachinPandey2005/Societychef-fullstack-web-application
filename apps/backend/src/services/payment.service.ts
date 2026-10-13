import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderService } from './order.service';
import { ValidationError, NotFoundError } from '../utils/errors';
import { env } from '../config/env';

const getRazorpayClient = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in the environment.');
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
};

export class PaymentService {
  static async createRazorpayOrder(consumer_id: string, internal_order_id: string) {
    const internalOrder = await OrderService.getOrderById(internal_order_id);
    
    if (internalOrder.profile_id !== consumer_id) {
      throw new ValidationError('Order does not belong to this consumer');
    }

    if (internalOrder.status !== 'PENDING') {
      throw new ValidationError(`Cannot initiate payment for order in ${internalOrder.status} state`);
    }

    // Check if there's already a successful payment
    const existingPayments = await PaymentRepository.findByInternalOrderId(internal_order_id);
    const hasSuccessfulPayment = existingPayments.some(p => p.payment_status === 'CAPTURED' || p.payment_status === 'AUTHORIZED');
    if (hasSuccessfulPayment) {
      throw new ValidationError('This order has already been paid for');
    }

    // Convert internal grand_total to integer minor units if not already
    const amountInPaise = Math.round(internalOrder.grand_total * 100); 

    let rzpOrder;
    try {
      rzpOrder = await getRazorpayClient().orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcptid_${internalOrder.id.substring(0, 8)}`,
      });
    } catch (error: any) {
      throw new Error(`Razorpay Order Creation Failed: ${error.message}`);
    }

    // Save PENDING payment record
    const payment = await PaymentRepository.createPayment({
      order_id: internal_order_id,
      consumer_id,
      razorpay_order_id: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      payment_status: 'PENDING'
    });

    return {
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      internal_payment_id: payment.id
    };
  }

  static async verifyPayment(consumer_id: string, razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) {
    const payment = await PaymentRepository.findByRazorpayOrderId(razorpay_order_id);
    if (!payment) throw new NotFoundError('Payment record not found');
    if (payment.consumer_id !== consumer_id) throw new ValidationError('Payment does not belong to this consumer');

    // Idempotency guard: a retried/duplicate/concurrent call for a payment
    // that's already been captured must not re-run order status updates or
    // re-trigger settlement (which would double-credit the chef wallet).
    if (payment.payment_status === 'CAPTURED') {
      return payment;
    }

    // Verify Signature
    const secret = env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new ValidationError('RAZORPAY_KEY_SECRET is not configured');
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      // Mark as failed
      await PaymentRepository.updatePaymentRecord(payment.id, { payment_status: 'FAILED' });
      throw new ValidationError('Invalid payment signature');
    }

    // Mark as CAPTURED (Assuming auto-capture is on in Razorpay)
    const updatedPayment = await PaymentRepository.updatePaymentRecord(payment.id, {
      razorpay_payment_id,
      razorpay_signature,
      payment_status: 'CAPTURED',
      payment_timestamp: new Date().toISOString()
    });

    // Update internal Order status to ACCEPTED (signifying kitchen can start preparing)
    await OrderService.updateOrderStatus(payment.order_id, 'ACCEPTED', 'consumer');

    // Automatically trigger Commission Calculation & Settlement Engine
    try {
      const { SettlementService } = require('./settlement.service');
      await SettlementService.processAutomaticOrderSettlement(payment.order_id, payment.id);
    } catch (err) {
      console.error('Failed to trigger automatic settlement for payment', payment.id, err);
    }

    return updatedPayment;
  }

  static async getTransactionHistory(consumer_id: string) {
    return PaymentRepository.getPaymentHistory(consumer_id);
  }
}
