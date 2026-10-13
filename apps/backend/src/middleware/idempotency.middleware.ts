import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { logger } from '../utils/logger';

// In production, this would be backed by Redis for multi-node support.
// We keep responses for 24 hours to handle edge mobile disconnects.
const idempotencyCache = new LRUCache<string, any>({
  max: 10000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

/**
 * Stage 10: Network Resilience
 * Idempotency middleware for POST/PUT requests (Orders, Payments).
 * If the exact same request drops on the client but reaches the server, 
 * the next retry will return the cached success response rather than double charging.
 */
export const requireIdempotency = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return next();
  }

  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  
  if (!idempotencyKey) {
    // If not provided, we just let it pass to preserve backward compatibility for legacy clients (Stage 1 Hard Rule).
    return next();
  }

  // Generate a composite key scoped to the user to prevent collisions
  const compositeKey = `${req.user?.id || 'anon'}:${idempotencyKey}`;

  if (idempotencyCache.has(compositeKey)) {
    logger.info(`Idempotent hit for key ${idempotencyKey}. Returning cached response.`);
    const cachedResponse = idempotencyCache.get(compositeKey);
    return res.status(cachedResponse.statusCode || 200).json(cachedResponse.body);
  }

  // Intercept the `res.json` method to cache the response on success
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(compositeKey, {
        statusCode: res.statusCode,
        body
      });
    }
    return originalJson(body);
  };

  next();
};
