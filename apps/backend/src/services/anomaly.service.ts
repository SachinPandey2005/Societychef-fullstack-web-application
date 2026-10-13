import { logger } from '../utils/logger';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { AIFactory } from './ai/ai_factory';

export class AnomalyService {
  /**
   * Stage 7: Evaluates metrics asynchronously for statistical anomalies.
   */
  static async evaluateThresholds(metricName: string, recentValue: number) {
    // Stub historical baseline
    const baseline = [{ value: 50 }, { value: 55 }];
    const aiProvider = AIFactory.getProvider();
    
    const analysis = await aiProvider.predict(`Is ${recentValue} an anomaly for ${metricName}?`, baseline);
    
    // Trigger if AI says it is an anomaly with high confidence
    // For stub purposes, just force it false unless testing specifically
    const isAnomaly = false; 

    if (isAnomaly) {
      logger.warn(`Anomaly detected for ${metricName}`, { analysis });
      internalEventBus.emit('ANOMALY_DETECTED', { metricName, recentValue, analysis });
    }
  }
}
