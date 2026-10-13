import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../utils/errors';
import { Role } from '../types/profile';

// Role.OPERATIONS is the only TS literal for ops staff, but the real stored
// profiles.role value for ops accounts has always been lowercase 'ops' —
// confirmed by AuthService#adminLogin's own adminRoles allowlist and by
// auth.middleware.ts/mfa.service.ts, which both check literal 'ops', never
// 'OPERATIONS'. 'ops' and 'OPERATIONS' are different strings, not case
// variants of each other, so the case-insensitive comparison below never
// matched them — every route gated with requireRole([...,'OPERATIONS']))
// (analytics, CRM, finance, settlements, refunds, and more) 403'd real ops
// accounts outright. party.routes.ts worked around this one file at a time
// with an `as any` cast; fixed at the root here instead so every route
// gated on 'OPERATIONS' now also accepts the real 'ops' value.
const ROLE_ALIASES: Record<string, string[]> = {
  OPERATIONS: ['operations', 'ops'],
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AuthorizationError('Authentication required');
      }

      const userRoleUpper = (user.role || '').toUpperCase();
      const userRoleLower = (user.role || '').toLowerCase();

      // SUPER_ADMIN, ADMIN or super_admin/admin always has access to everything
      if (
        userRoleUpper === 'SUPER_ADMIN' ||
        userRoleUpper === 'ADMIN' ||
        userRoleUpper.includes('ADMIN') ||
        userRoleLower === 'super_admin' ||
        userRoleLower === 'admin'
      ) {
        return next();
      }

      // Check if user's role is in the allowed list (case-insensitive,
      // plus known role-name aliases like OPERATIONS/ops above)
      const isAllowed = allowedRoles.some((r) => {
        if (r.toLowerCase() === userRoleLower || r.toUpperCase() === userRoleUpper) return true;
        const aliases = ROLE_ALIASES[r.toUpperCase()];
        return aliases ? aliases.includes(userRoleLower) : false;
      });

      if (!isAllowed) {
        throw new AuthorizationError('You do not have permission to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthorizationError('Authentication required');
      }

      const userRoleUpper = (user.role || '').toUpperCase();
      if (
        userRoleUpper === 'SUPER_ADMIN' ||
        userRoleUpper === 'ADMIN' ||
        user.role === 'super_admin' ||
        user.role === 'admin'
      ) {
        return next();
      }

      const { RbacRepository } = require('../repositories/rbac.repository');
      const permissions = await RbacRepository.getUserPermissions(user.id);

      if (!permissions.includes(requiredPermission)) {
        throw new AuthorizationError(`Missing required permission: ${requiredPermission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
