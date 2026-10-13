import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { traceStorage } from '../telemetry/telemetry.provider';

/**
 * Injects a correlation ID into the AsyncLocalStorage context for the lifetime of the request.
 * (Stage 3 & 5: Structured Logging and Distributed Tracing)
 */
export const injectTracing = (req: Request, res: Response, next: NextFunction) => {
  // Use existing trace header if present (e.g. W3C traceparent), else generate one
  const traceId = (req.headers['x-trace-id'] as string) || (req.headers['traceparent'] as string) || uuidv4();
  
  // Set the trace ID in the response headers for the client
  res.setHeader('x-trace-id', traceId);

  // Run the request in the context of this trace ID
  traceStorage.run(traceId, () => {
    next();
  });
};
