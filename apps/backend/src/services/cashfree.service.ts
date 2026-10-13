import crypto from 'crypto';
import { CashfreeClient, CashfreePaymentEntity } from '../integrations/cashfree.client';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderService } from './order.service';
import { OrderRepository } from '../repositories/order.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { SettlementService } from './settlement.service';
import { NotificationService } from './notification.service';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class CashfreeService {
  /**
   * Creates a Cashfree Order and generates payment_session_id for hosted/app checkout.
   */
  static async createCashfreeOrder(
    consumer_id: string,
    order_id: string,
    customerOverride?: {
      name?: string;
      phone?: string;
      email?: string;
      associated_order_ids?: string[];
    }
  ) {
    // 1. Resolve the authoritative set of real orders being paid for and sum
    // their server-computed totals. The amount charged by Cashfree must
    // NEVER come from the client — customerOverride.amount used to override
    // grandTotal outright, meaning any caller could request a real Cashfree
    // payment session for an arbitrary (e.g. ₹1) amount regardless of what
    // the order(s) actually cost. associated_order_ids is still
    // client-supplied, but each id is individually looked up and
    // ownership/payment-status-checked below, so it can only ever name real
    // orders the caller actually owns — it can't inflate or deflate a total.
    let associatedOrderIds: string[] = (customerOverride?.associated_order_ids && customerOverride.associated_order_ids.length > 0)
      ? Array.from(new Set([order_id, ...customerOverride.associated_order_ids]))
      : [order_id];

    let grandTotal = 0;
    let orderDescription = `Society Chef Order #${order_id}`;

    for (const oid of associatedOrderIds) {
      const order = await OrderRepository.getOrderById(oid).catch(() => null);
      if (!order) {
        throw new NotFoundError(`Order ${oid} not found`);
      }

      const orderOwner = order.profile_id || (order as any).customer_id || (order as any).consumer_id;
      if (orderOwner && orderOwner !== consumer_id) {
        throw new AuthorizationError('Order does not belong to this consumer');
      }

      if (order.payment_status === 'paid' || order.payment_status === 'CAPTURED') {
        throw new ValidationError('This order has already been paid for');
      }

      grandTotal += Number(order.grand_total || (order as any).total_paid || (order as any).item_total || 0);

      if (oid === order_id) {
        const codeStr = (order as any).order_code || order.id.substring(0, 8);
        orderDescription = `Society Chef #${codeStr}`;
      }
    }

    if (!grandTotal || grandTotal <= 0) {
      throw new ValidationError(`Invalid order amount for payment initiation: ₹${grandTotal}`);
    }

    // Check if there is already a CAPTURED payment for this order
    const existingPayments = await PaymentRepository.findByInternalOrderId(order_id);
    const hasCaptured = existingPayments.some(p => p.payment_status === 'CAPTURED' || p.payment_status === 'SUCCESS');
    if (hasCaptured) {
      throw new ValidationError('This order has already been paid for');
    }

    // 2. Fetch Customer Details
    let customerPhone = '9999999999';
    let customerName = 'Rasohi Customer';
    let customerEmail = 'orders@rasohi.com';

    try {
      const profile = await ProfileRepository.findById(consumer_id);
      if (profile) {
        if (profile.name) customerName = profile.name;
        if (profile.email) customerEmail = profile.email;
        if (profile.phone) {
          const digits = profile.phone.replace(/\D/g, '');
          customerPhone = digits.length >= 10 ? digits.slice(-10) : customerPhone;
        }
      }
    } catch {
      // fallback
    }

    if (customerOverride?.name) customerName = customerOverride.name;
    if (customerOverride?.email) customerEmail = customerOverride.email;
    if (customerOverride?.phone) {
      const digits = customerOverride.phone.replace(/\D/g, '');
      customerPhone = digits.length >= 10 ? digits.slice(-10) : customerPhone;
    }

    // 3. Construct unique Cashfree Order ID
    const sanitizedId = order_id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const cf_order_id = `cf_${sanitizedId}_${Date.now().toString(36)}`;

    // 4. Return & Notify URLs
    const return_url = env.CASHFREE_RETURN_URL.includes('{order_id}')
      ? env.CASHFREE_RETURN_URL.replace('{order_id}', cf_order_id)
      : `${env.CASHFREE_RETURN_URL}?order_id=${cf_order_id}`;

    const notify_url = env.CASHFREE_WEBHOOK_URL || undefined;

    // 5. Create Order in Cashfree
    const cfOrder = await CashfreeClient.createOrder({
      order_id: cf_order_id,
      order_amount: Number(grandTotal.toFixed(2)),
      order_currency: 'INR',
      order_note: orderDescription,
      customer_details: {
        customer_id: consumer_id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url,
        notify_url,
      },
    });

    // 6. Record PENDING payment in repository
    const payment = await PaymentRepository.createPayment({
      order_id,
      consumer_id,
      amount: grandTotal,
      currency: 'INR',
      payment_gateway: 'CASHFREE',
      cf_order_id: cfOrder.cf_order_id || cf_order_id,
      payment_session_id: cfOrder.payment_session_id,
      payment_status: 'PENDING',
      metadata: {
        associated_order_ids: associatedOrderIds,
        checkout_url: cfOrder.checkout_url,
      },
    });

    // Update order record with cf_order_id & payment_session_id
    for (const oid of associatedOrderIds) {
      try {
        await OrderRepository.updatePaymentGatewayFields(oid, {
          cfOrderId: cfOrder.cf_order_id || cf_order_id,
          paymentSessionId: cfOrder.payment_session_id,
          paymentGateway: 'CASHFREE',
        });
      } catch {
        // non-blocking
      }
    }

    return {
      order_id,
      cf_order_id: cfOrder.cf_order_id || cf_order_id,
      payment_session_id: cfOrder.payment_session_id,
      checkout_url: cfOrder.checkout_url,
      amount: grandTotal,
      currency: 'INR',
      internal_payment_id: payment.id,
    };
  }

  /**
   * Verifies Cashfree payment status by querying Cashfree API and updates DB.
   */
  static async verifyCashfreeOrder(consumer_id: string, order_id: string, cf_order_id?: string) {
    // Look up payment
    let payment = cf_order_id
      ? await PaymentRepository.findByCfOrderId(cf_order_id)
      : null;

    if (!payment) {
      const payments = await PaymentRepository.findByInternalOrderId(order_id);
      if (payments && payments.length > 0) {
        payment = payments[payments.length - 1];
      }
    }

    if (!payment) {
      throw new NotFoundError('Payment record not found for this order');
    }

    // Ownership check
    if (payment.consumer_id && payment.consumer_id !== consumer_id) {
      throw new AuthorizationError('Payment does not belong to this consumer');
    }

    const targetCfOrderId = payment.cf_order_id || cf_order_id;
    if (!targetCfOrderId) {
      throw new ValidationError('No Cashfree order reference found');
    }

    // Idempotency: If already captured, return immediately
    if (payment.payment_status === 'CAPTURED' || payment.payment_status === 'SUCCESS') {
      return {
        success: true,
        already_captured: true,
        payment,
      };
    }

    // Query Cashfree API directly for authoritative order & payment status
    const cfOrder = await CashfreeClient.getOrder(targetCfOrderId);
    const cfPayments = await CashfreeClient.getOrderPayments(targetCfOrderId).catch(() => []);

    const successfulPayment: CashfreePaymentEntity | undefined = cfPayments.find(p => p.payment_status === 'SUCCESS');

    if (cfOrder.order_status === 'PAID' || successfulPayment) {
      const paymentId = successfulPayment?.cf_payment_id || `cf_pay_${Date.now()}`;
      const paymentMethod = successfulPayment?.payment_group || 'UPI';

      // 1. Mark payment CAPTURED
      const updatedPayment = await PaymentRepository.updatePaymentRecord(payment.id, {
        payment_status: 'CAPTURED',
        cf_payment_id: paymentId,
        payment_method: paymentMethod,
        payment_timestamp: successfulPayment?.payment_time || new Date().toISOString(),
      });

      // 2. Mark order(s) ACCEPTED
      const associatedOrderIds: string[] = payment.metadata?.associated_order_ids || [payment.order_id];
      for (const oid of associatedOrderIds) {
        try {
          await OrderRepository.updatePaymentGatewayFields(oid, {
            status: 'ACCEPTED',
            paymentStatus: 'paid',
            cfPaymentId: paymentId,
            acceptedAt: new Date().toISOString(),
          });
        } catch {
          // non-blocking
        }

        // 3. Trigger automatic settlement for kitchen
        try {
          await SettlementService.processAutomaticOrderSettlement(oid, payment.id);
        } catch (err) {
          logger.error(`[CashfreeService] Settlement error for order ${oid}:`, err);
        }
      }

      return {
        success: true,
        payment: updatedPayment,
        order_status: 'ACCEPTED',
      };
    }

    if (cfOrder.order_status === 'EXPIRED') {
      await PaymentRepository.updatePaymentRecord(payment.id, { payment_status: 'FAILED' });
      return {
        success: false,
        payment_status: 'FAILED',
        message: 'Order expired in payment gateway',
      };
    }

    const failedPayment = cfPayments.find(p => p.payment_status === 'FAILED' || p.payment_status === 'USER_DROPPED');
    if (failedPayment) {
      const mappedStatus = failedPayment.payment_status === 'USER_DROPPED' ? 'USER_DROPPED' : 'FAILED';
      await PaymentRepository.updatePaymentRecord(payment.id, { payment_status: mappedStatus });
      return {
        success: false,
        payment_status: mappedStatus,
        message: failedPayment.payment_message || 'Payment was not completed',
      };
    }

    return {
      success: false,
      payment_status: payment.payment_status,
      message: 'Payment is pending',
    };
  }

  /**
   * Verifies timing-safe HMAC-SHA256 signature for Cashfree webhook
   */
  static verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): boolean {
    const secret = env.CASHFREE_SECRET_KEY;
    if (!secret) {
      logger.error('[CashfreeService] CASHFREE_SECRET_KEY is not configured for webhook verification');
      return false;
    }

    try {
      const payload = timestamp + rawBody;
      const expectedBuf = Buffer.from(
        crypto.createHmac('sha256', secret).update(payload).digest('base64')
      );
      const sigBuf = Buffer.from(signature);

      if (expectedBuf.length !== sigBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch (err) {
      logger.error('[CashfreeService] Error calculating webhook signature:', err);
      return false;
    }
  }

  /**
   * Handles incoming Cashfree webhook with idempotency & replay protection
   */
  static async handleWebhookEvent(rawBody: string, signature: string, timestamp: string) {
    // 1. Replay attack protection: reject webhooks older than 5 minutes
    const tsNum = Number(timestamp);
    const tsMs = tsNum > 1e11 ? tsNum : tsNum * 1000;
    if (!tsMs || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
      logger.warn('[CashfreeService] Stale webhook timestamp, possible replay attack:', { timestamp });
      throw new ValidationError('Stale webhook timestamp (replay attack detected)');
    }

    // 2. Signature verification
    const isValid = this.verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      logger.warn('[CashfreeService] Invalid webhook signature received');
      throw new ValidationError('Invalid webhook signature');
    }

    let eventData: any;
    try {
      eventData = JSON.parse(rawBody);
    } catch {
      throw new ValidationError('Invalid JSON payload');
    }

    const eventType: string = eventData.type || '';
    const orderData = eventData.data?.order;
    const paymentData = eventData.data?.payment;
    const cfOrderId: string = orderData?.order_id || '';

    logger.info(`[CashfreeService] Processing webhook event: ${eventType} for order ${cfOrderId}`);

    // 3. Strict Idempotency Check via webhook_events table
    const eventId = `${eventType}_${cfOrderId}_${paymentData?.cf_payment_id || timestamp}`;
    const existingEvent = await PaymentRepository.findWebhookEvent(eventId);
    if (existingEvent) {
      logger.info(`[CashfreeService] Duplicate webhook ignored: ${eventId}`);
      return { ok: true, duplicate: true };
    }

    // Record webhook event
    await PaymentRepository.recordWebhookEvent({
      event_id: eventId,
      event_type: eventType,
      cf_order_id: cfOrderId,
      payload: eventData,
    });

    // 4. Look up Payment Record
    const payment = await PaymentRepository.findByCfOrderId(cfOrderId);
    if (!payment) {
      logger.warn(`[CashfreeService] No payment record found for webhook order: ${cfOrderId}`);
      return { ok: true, matched: false };
    }

    // 5. Handle Payment Success
    if (/SUCCESS/i.test(eventType)) {
      if (payment.payment_status === 'CAPTURED' || payment.payment_status === 'SUCCESS') {
        logger.info(`[CashfreeService] Payment ${payment.id} already captured. Skipping redundant updates.`);
        return { ok: true, already_processed: true };
      }

      const cfPaymentId = paymentData?.cf_payment_id || `cf_pay_${Date.now()}`;
      const paymentMethod = paymentData?.payment_group || 'UPI';

      // Update payment
      await PaymentRepository.updatePaymentRecord(payment.id, {
        payment_status: 'CAPTURED',
        cf_payment_id: cfPaymentId,
        payment_method: paymentMethod,
        payment_timestamp: paymentData?.payment_time || new Date().toISOString(),
      });

      // Update order(s)
      const associatedOrderIds: string[] = payment.metadata?.associated_order_ids || [payment.order_id];
      for (const oid of associatedOrderIds) {
        try {
          await OrderRepository.updatePaymentGatewayFields(oid, {
            status: 'ACCEPTED',
            paymentStatus: 'paid',
            cfPaymentId: cfPaymentId,
            acceptedAt: new Date().toISOString(),
          });
        } catch (updateErr) {
          logger.error(`[CashfreeService] Failed to update order status for ${oid}:`, updateErr);
        }

        // Trigger automatic settlement
        try {
          await SettlementService.processAutomaticOrderSettlement(oid, payment.id);
        } catch (err) {
          logger.error(`[CashfreeService] Settlement error in webhook for order ${oid}:`, err);
        }

        // Notify Chef
        try {
          const ord = await OrderRepository.getOrderById(oid);
          const kitchen = ord?.kitchen_id ? await KitchenRepository.findById(ord.kitchen_id) : null;
          if (kitchen?.chef_user_id) {
            await NotificationService.sendNotification({
              profile_id: kitchen.chef_user_id,
              title: '🔔 New Paid Order Confirmed!',
              message: `Order #${oid.substring(0, 8)} for ₹${ord?.grand_total} confirmed via Cashfree.`,
              type: 'CHEF_ALERT',
              entity_type: 'order',
              entity_id: oid,
            });
          }
        } catch {}
      }

      // Notify Consumer
      try {
        if (payment.consumer_id) {
          await NotificationService.sendNotification({
            profile_id: payment.consumer_id,
            title: '🎉 Payment Successful!',
            message: `Your payment of ₹${payment.amount} has been received. Kitchen has started preparing your order!`,
            type: 'ORDER_UPDATE',
            entity_type: 'order',
            entity_id: payment.order_id,
          });
        }
      } catch {}

      return { ok: true, status: 'CAPTURED' };
    }

    // 6. Handle Payment Failure / User Dropped
    if (/FAILED|USER_DROPPED/i.test(eventType)) {
      if (payment.payment_status === 'CAPTURED' || payment.payment_status === 'SUCCESS') {
        return { ok: true, ignored: true }; // Do not downgrade paid orders
      }

      const failureStatus = /USER_DROPPED/i.test(eventType) ? 'USER_DROPPED' : 'FAILED';
      await PaymentRepository.updatePaymentRecord(payment.id, {
        payment_status: failureStatus,
      });

      return { ok: true, status: failureStatus };
    }

    return { ok: true, unhandled_event: eventType };
  }

  /**
   * Processes a refund through Cashfree
   */
  static async refundCashfreePayment(order_id: string, amount: number, reason: string) {
    const payments = await PaymentRepository.findByInternalOrderId(order_id);
    const capturedPayment = payments.find(p => p.payment_status === 'CAPTURED' || p.payment_status === 'SUCCESS');

    if (!capturedPayment || !capturedPayment.cf_order_id) {
      throw new ValidationError('No captured Cashfree payment found for this order to refund');
    }

    const refundId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const cfRefund = await CashfreeClient.createRefund(capturedPayment.cf_order_id, {
      refund_amount: Number(amount.toFixed(2)),
      refund_id: refundId,
      refund_note: reason,
    });

    await PaymentRepository.updatePaymentRecord(capturedPayment.id, {
      refund_status: cfRefund.refund_status || 'REFUNDED',
      payment_status: cfRefund.refund_status === 'SUCCESS' ? 'REFUNDED' : 'REFUND_PENDING',
    });

    return cfRefund;
  }
}
