import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

/**
 * Authenticates Developer API Keys for public-facing v1 APIs.
 * Bypasses standard user JWTs to allow programmatic access.
 *
 * NOTE: there is no real API key issuance/storage system yet
 * (DeveloperController.generateApiKey never persists the key it hands out).
 * Until that exists, this only accepts a single key configured via
 * TEST_API_KEY and fails closed if that env var isn't set — it must NOT
 * fall back to accepting any string shaped like a key.
 */
const timingSafeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const configuredKey = process.env.TEST_API_KEY;

  if (!apiKey) {
    return sendError(res, 'Unauthorized: X-API-Key header is missing', null, 401);
  }

  if (!configuredKey || !timingSafeEqual(apiKey, configuredKey)) {
    logger.warn(`Failed API Key attempt: ${apiKey.substring(0, 8)}...`);
    return sendError(res, 'Unauthorized: Invalid API Key', null, 401);
  }

  // Attach developer context
  (req as any).developer = {
    appId: 'app_123',
    permissions: ['read:orders']
  };

  next();
};
