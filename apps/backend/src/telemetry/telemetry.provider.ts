import { AsyncLocalStorage } from 'async_hooks';

export const traceStorage = new AsyncLocalStorage<string>();

/**
 * Stage 2: Provider-agnostic Telemetry Abstraction
 * No direct imports from Datadog, Prometheus, etc.
 */
export class TelemetryProvider {
  /**
   * Tracks a counter or gauge metric.
   */
  static recordMetric(name: string, value: number, tags: Record<string, string> = {}) {
    // In a real system, this forwards to the configured exporter.
    // For now, it behaves as a stub/mock exporter.
    const traceId = traceStorage.getStore();
    
    // Mask any PII keys before emitting
    const safeTags = this.maskPII(tags);
    // console.log(`[Metric] ${name}=${value}`, safeTags, `Trace: ${traceId}`);
  }

  /**
   * Starts a tracing span.
   */
  static startSpan(name: string, callback: () => void) {
    // Stub for distributed tracing
    const traceId = traceStorage.getStore();
    // console.log(`[Trace Start] Span: ${name}, TraceID: ${traceId}`);
    callback();
    // console.log(`[Trace End] Span: ${name}`);
  }

  /**
   * Prevents PII or secrets from leaking into metrics/traces.
   */
  private static maskPII(data: Record<string, any>) {
    const sensitiveKeys = ['password', 'token', 'secret', 'email', 'phone'];
    const masked: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        masked[key] = '***REDACTED***';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }
}
