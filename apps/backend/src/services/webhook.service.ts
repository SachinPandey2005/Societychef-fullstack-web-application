import { logger } from '../utils/logger';
import crypto from 'crypto';
import { env } from '../config/env';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderService } from './order.service';

export class WebhookService {
  /**
   * Stage 4: Generates an HMAC SHA-256 signature for the payload
   */
  static signPayload(payload: any, secret: string): string {
    const stringified = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(stringified).digest('hex');
  }

  /**
   * Stage 4: Dispatches a webhook asynchronously.
   * In a real implementation, this pushes to a background queue (e.g. BullMQ).
   */
  static async dispatchEvent(event: string, payload: any) {
    logger.info(`Dispatching Webhook for event: ${event}`);
    
    // Stub background job push
    // await queue.add('deliver-webhook', { event, payload });
  }

  /**
   * Compatibility methods for Payment Controller
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      logger.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return false;
    }
    
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return expectedSignature === signature;
  }

  static async handleEvent(eventData: any) {
    logger.info('Handling incoming webhook event', { event: eventData.event });
    
    if (eventData.event === 'payment.captured' || eventData.event === 'order.paid') {
      const paymentEntity = eventData.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      const payment = await PaymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (payment && payment.payment_status !== 'CAPTURED') {
        await PaymentRepository.updatePaymentRecord(payment.id, {
          razorpay_payment_id: paymentEntity.id,
          payment_status: 'CAPTURED',
          payment_timestamp: new Date().toISOString()
        });
        
        await OrderService.updateOrderStatus(payment.order_id, 'ACCEPTED', 'consumer');
        logger.info(`Updated order ${payment.order_id} to ACCEPTED via webhook`);

        // Automatically trigger Commission Calculation & Settlement Engine with Idempotency Guard
        try {
          const { SettlementService } = require('./settlement.service');
          await SettlementService.processAutomaticOrderSettlement(payment.order_id, payment.id);
          logger.info(`Processed automatic settlement for order ${payment.order_id} via webhook`);
        } catch (err) {
          logger.error('Failed automatic settlement in webhook handler:', err);
        }
      }
    }
  }
}
