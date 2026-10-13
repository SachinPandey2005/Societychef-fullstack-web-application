import type { AuthUser, Role } from '../types';

/**
 * Converts the backend's resolved-session-user shape (snake_case, matching
 * the Postgres columns — see AuthService.resolveSessionUser) into the
 * mobile app's AuthUser shape. Centralized so phone/otp/session-restore
 * don't each re-implement this mapping.
 */
export function mapBackendUserToAuthUser(u: any): AuthUser {
  return {
    id: u.id,
    phone: u.phone || '',
    email: u.email || undefined,
    role: (u.role as Role) || 'consumer',
    roles: (Array.isArray(u.roles) ? u.roles : ['consumer']) as Role[],
    activeRole: (u.active_role as Role) || (u.role as Role) || 'consumer',
    displayName: u.display_name || 'Resident',
    society: u.society || undefined,
    flat: u.flat || undefined,
    chefProfileId: u.chef_profile_id || undefined,
    avatarUrl: u.avatar_url || undefined,
    coverImage: u.cover_image || undefined,
  };
}
