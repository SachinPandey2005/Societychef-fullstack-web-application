import { FraudRuleService } from './fraud_rule.service';
import { FraudRepository } from '../repositories/fraud.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';

export class FraudService {
  static init() {
    internalEventBus.on(EVENTS.ORDER_PLACED, async (order) => {
      logger.info(`Evaluating fraud rules for order ${order.id}`);
      try {
        const actions = await FraudRuleService.evaluateEvent('ORDER_PLACED', order);
        await this.executeActions(order.consumer_id, order.id, 'ORDER', actions);
      } catch (err) {
        logger.error(`Fraud evaluation failed for order ${order.id}`, err);
      }
    });

    internalEventBus.on(EVENTS.PAYMENT_FAILED, async (payment) => {
      // Simulate trust score adjustment on payment failures
      logger.info(`Recording payment failure against trust score for ${payment.consumer_id}`);
    });
  }

  static async executeActions(actor_id: string, target_id: string, target_type: 'USER' | 'ORDER' | 'PAYMENT', actions: string[]) {
    if (actions.length === 0) return;

    logger.warn(`Fraud actions triggered for ${actor_id}: ${actions.join(', ')}`);

    // Log the immutable action
    await FraudRepository.logActivity(actor_id, 'SYSTEM_AUTOMATED_ACTION', { target_id, target_type, actions });

    // Execute side effects based on action
    if (actions.includes('FLAG_ACCOUNT') || actions.includes('ESCALATE_TO_OPS')) {
      const fraudCase = await FraudRepository.createCase({
        target_id: actor_id,
        target_type: 'USER',
        status: 'OPEN',
        triggered_rules: actions // For demo, storing actions as rule traces
      });
      internalEventBus.emit(EVENTS.ACCOUNT_FLAGGED, fraudCase);
    }
  }

  static async createRule(payload: any) {
    return FraudRepository.createRule(payload);
  }

  static async resolveCase(id: string, status: string, notes: string) {
    return FraudRepository.resolveCase(id, status, notes);
  }
}

FraudService.init();
