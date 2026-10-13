import { useAuthStore } from '../store/useAuthStore';
import type { Role } from '../types';

export type RoleGuardResult =
  | { state: 'loading' }
  | { state: 'denied'; redirectTo: string }
  | { state: 'allowed' };

/**
 * Client-side route guard for role-scoped route groups (e.g. app/(ops), app/(chef)).
 *
 * This is a UX safeguard, not the security boundary — expo-router serves every
 * file-based route regardless of how a user got there (deep link, browser back
 * button on web, manually typed URL), and none of the (ops)/(chef)/(consumer)
 * layouts previously checked the signed-in user's role before rendering. The real
 * enforcement lives server-side in the backend's requireAuth/requireRole
 * middleware and per-resource ownership checks (apps/backend/src/middleware) —
 * this hook exists so a user who isn't authorized for a route group is
 * redirected before the screen renders and issues any requests, rather than
 * briefly seeing another role's data.
 *
 * Pass the roles allowed to view this route group. `redirectTo` is where a
 * disallowed user is sent instead.
 */
export function useRoleGuard(allowedRoles: Role[], redirectTo: string): RoleGuardResult {
  const { user, isGuest, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return { state: 'loading' };
  }

  const effectiveRole = (user?.activeRole ?? user?.role) as Role | undefined;
  const isAllowed =
    !!effectiveRole &&
    (allowedRoles.includes(effectiveRole) || allowedRoles.includes(user?.role as Role));

  if (!isAllowed) {
    // Guests and mismatched roles both get redirected — a guest has no role at
    // all, so they're never allowed into a role-scoped area like (ops) or (chef).
    void isGuest;
    return { state: 'denied', redirectTo };
  }

  return { state: 'allowed' };
}
