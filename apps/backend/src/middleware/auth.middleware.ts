import { Request, Response, NextFunction } from 'express';
import { AuthService, VerificationMethod } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { sendError } from '../utils/response';
import { AuthenticationError } from '../utils/errors';
import { LRUCache } from 'lru-cache';
import { logger } from '../utils/logger';

const tokenCache = new LRUCache<string, { profile: any; verificationMethod: VerificationMethod }>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export const clearCachedToken = (token: string) => {
  tokenCache.delete(token);
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 'Unauthorized', null, 401);
    const userRoleUpper = (req.user.role || '').toUpperCase();
    const normalizedAllowed = roles.map(r => r.toUpperCase());
    if (
      userRoleUpper === 'SUPER_ADMIN' ||
      userRoleUpper === 'ADMIN' ||
      normalizedAllowed.some(r => userRoleUpper.includes(r) || r.includes(userRoleUpper))
    ) {
      return next();
    }
    return sendError(res, 'Forbidden', null, 403);
  };
};

/**
 * Validates that the requesting user owns the resource being accessed.
 * For admins/ops, it allows bypassing this check.
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return sendError(res, 'Unauthorized', null, 401);

    // Admins and Ops bypass ownership checks
    if (['admin', 'ops'].includes(user.role)) {
      return next();
    }

    const targetId = req.params[resourceIdParam] || req.body[resourceIdParam];
    if (user.id !== targetId) {
      return sendError(res, 'Forbidden: Resource ownership required', null, 403);
    }

    next();
  };
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const tokenLength = authHeader ? authHeader.length : 0;

  // Phase 2 Safe Diagnostic Logging: AUTH REQUEST (NO raw tokens)
  logger.info('[AUTH REQUEST]', {
    path: req.originalUrl,
    method: req.method,
    authorizationHeaderPresent: !!authHeader,
    tokenLength,
  });

  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('Token not found');
    }

    // Check session active status
    if (!(await SessionService.isSessionActive(token))) {
      tokenCache.delete(token);
      throw new AuthenticationError('Session has been revoked');
    }

    let cached = tokenCache.get(token);
    
    if (cached) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          tokenCache.delete(token);
          cached = undefined;
        }
      } catch (e) {
        tokenCache.delete(token);
        cached = undefined;
      }
    }

    let profile: any;
    let verificationMethod: VerificationMethod = 'LOCAL_JWT';

    if (cached) {
      profile = cached.profile;
      verificationMethod = cached.verificationMethod;
    } else {
      const result = await AuthService.verifyTokenWithDetails(token);
      profile = result.profile;
      verificationMethod = result.verificationMethod;
      tokenCache.set(token, { profile, verificationMethod });
    }

    // Phase 2 Safe Diagnostic Logging: AUTH RESULT
    logger.info('[AUTH RESULT]', {
      path: req.originalUrl,
      method: req.method,
      verificationMethod,
      success: true,
      failureReason: null,
    });

    // Verify account active status (P2-01 Fix: Reject suspended or banned
    // users). profile.is_suspended was checked here too but never existed as
    // a real column on profiles — status is the real field this already
    // worked through.
    if (profile && (profile.status === 'SUSPENDED' || profile.status === 'BANNED')) {
      tokenCache.delete(token);
      throw new AuthenticationError('Account has been suspended or deactivated');
    }

    req.user = profile;
    next();
  } catch (error: any) {
    const failureReason = error?.message || String(error);

    // Phase 2 Safe Diagnostic Logging: AUTH RESULT FAILURE
    logger.warn('[AUTH RESULT]', {
      path: req.originalUrl,
      method: req.method,
      verificationMethod: 'NONE',
      success: false,
      failureReason,
    });

    next(new AuthenticationError('Invalid or expired token'));
  }
};
