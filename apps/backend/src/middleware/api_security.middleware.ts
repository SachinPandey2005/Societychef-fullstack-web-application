import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

// Store used nonces for the last 5 minutes to prevent replay attacks
const nonceCache = new LRUCache<string, boolean>({
  max: 10000,
  ttl: 1000 * 60 * 5, // 5 minutes window
});

/**
 * Replay protection middleware.
 * Expects `X-Request-Timestamp` and `X-Request-Nonce` in headers.
 */
export const requireReplayProtection = (req: Request, res: Response, next: NextFunction) => {
  try {
    const timestamp = req.headers['x-request-timestamp'] as string;
    const nonce = req.headers['x-request-nonce'] as string;

    // Skip replay protection check in non-production environments or when security headers aren't present on standard web requests
    if (process.env.NODE_ENV !== 'production' || (!timestamp && !nonce)) {
      return next();
    }

    if (!timestamp || !nonce) {
      return sendError(res, 'Missing security headers: X-Request-Timestamp and X-Request-Nonce', null, 401);
    }

    const requestTime = parseInt(timestamp, 10);
    const now = Date.now();
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    // Check if timestamp is within an acceptable window (e.g. +/- 5 mins)
    if (isNaN(requestTime) || Math.abs(now - requestTime) > FIVE_MINUTES_MS) {
      return sendError(res, 'Request timestamp is outside the acceptable window', null, 401);
    }

    // Check if nonce has already been used
    if (nonceCache.has(nonce)) {
      logger.warn(`Replay attack detected. Nonce reused: ${nonce}`);
      return sendError(res, 'Replay attack detected. Nonce already used.', null, 401);
    }

    // Register nonce
    nonceCache.set(nonce, true);

    next();
  } catch (error) {
    logger.error('Security middleware error:', error);
    sendError(res, 'Internal security error', null, 500);
  }
};
