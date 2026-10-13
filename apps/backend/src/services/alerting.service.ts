import { logger } from '../utils/logger';
import { internalEventBus, EVENTS } from '../events/eventEmitter';

export class AlertingService {
  /**
   * Stage 6: Configurable Alerting. Evaluates thresholds.
   */
  static evaluateMetricThreshold(metricName: string, value: number) {
    const thresholds: Record<string, number> = {
      'api.errors': 50, // More than 50 errors per minute
      'cpu.usage': 85, // > 85%
    };

    const limit = thresholds[metricName];
    if (limit && value > limit) {
      logger.warn(`Alert Triggered: ${metricName} exceeded threshold (${value} > ${limit})`);
      
      internalEventBus.emit(EVENTS.ALERT_TRIGGERED, {
        metricName,
        value,
        threshold: limit,
        severity: 'HIGH'
      });
    }
  }
}
