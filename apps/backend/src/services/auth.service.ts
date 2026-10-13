import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth.repository';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { Profile } from '../types/profile';
import { NotFoundError, AuthenticationError, AuthorizationError } from '../utils/errors';
import { env } from '../config/env';

export type VerificationMethod = 'LOCAL_JWT' | 'DEV_BYPASS';

export interface ResolvedSessionUser {
  id: string;
  phone: string;
  display_name: string;
  role: string;
  roles: string[];
  active_role: string;
  chef_profile_id?: string;
  society?: string;
  flat?: string;
  email?: string;
  status?: string;
  avatar_url?: string;
  cover_image?: string;
}

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — matches the pre-existing dev-bypass token's lifetime, and nothing in the mobile app calls /auth/refresh today (confirmed), so a short-lived access token with no real refresh flow behind it would just log people out silently.
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days — headroom for Phase 3, when the mobile app is wired to actually use refresh.

export interface IssuedSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'bearer';
  user: { id: string; phone: string };
}

export class AuthService {
  static async syncProfile(user_id: string, phone: string): Promise<Profile> {
    let profile = await AuthRepository.findProfileById(user_id);

    if (!profile) {
      // Create a default profile if one does not exist
      profile = await AuthRepository.createProfile({
        id: user_id,
        phone,
        name: 'New User',
        role: 'consumer',
      });
    }

    return profile;
  }

  static async getProfileById(user_id: string): Promise<Profile> {
    const profile = await AuthRepository.findProfileById(user_id);
    if (!profile) throw new NotFoundError('Profile not found');
    return profile;
  }

  /**
   * Resolves a profile's chef/kitchen linkage server-side, authoritatively,
   * via chef_user_id/chef_profile_id. This replaces mobile-side logic that
   * used to fuzzy-match a user to a chef by name substring (e.g. "chef" or
   * a specific demo name) when direct linkage was missing — a real bug that
   * could misclassify any consumer whose name happened to match a kitchen.
   */
  static async resolveSessionUser(profile: Profile): Promise<ResolvedSessionUser> {
    let kitchen = await KitchenRepository.findByChefUserId(profile.id);
    if (!kitchen && profile.chef_profile_id) {
      kitchen = await KitchenRepository.findById(profile.chef_profile_id);
    }

    // hasChefCapability means "this profile is allowed to use chef mode"
    // (owns/linked to a kitchen) — it must NOT decide which mode they're
    // currently in. It previously did: activeRole was forced to 'chef'
    // whenever a kitchen existed, overriding whatever the user had actually
    // chosen (via switchActiveRole -> PATCH /auth/profile) on every single
    // login/session check. A chef who switched to consumer mode to browse
    // would get bounced straight back to the chef dashboard on their very
    // next login, with no way to ever present as a plain consumer again.
    const hasChefCapability = profile.role === 'chef' || !!kitchen || !!profile.chef_profile_id;
    const resolvedRole = hasChefCapability ? 'chef' : (profile.role || 'consumer');
    const activeRole = profile.active_role || (hasChefCapability ? 'chef' : 'consumer');

    return {
      id: profile.id,
      phone: profile.phone || '',
      display_name: profile.display_name || profile.name || (kitchen as any)?.chef_name || 'Resident',
      role: resolvedRole,
      roles: hasChefCapability ? ['consumer', 'chef'] : (profile.roles || ['consumer']),
      active_role: activeRole,
      chef_profile_id: kitchen?.id || profile.chef_profile_id || undefined,
      society: profile.society || undefined,
      flat: profile.flat,
      email: profile.email,
      status: profile.status,
      avatar_url: profile.avatar_url,
      cover_image: profile.cover_image,
    };
  }

  /**
   * Self-issues an access+refresh token pair for a profile, signed with
   * JWT_SECRET. This is the only session-issuance path now — Supabase Auth
   * (GoTrue) is gone, so nothing else can mint a session anymore.
   */
  static issueSession(profile: Profile): IssuedSession {
    const access_token = jwt.sign({ sub: profile.id, phone: profile.phone, role: profile.role, type: 'access' }, env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
    const refresh_token = jwt.sign({ sub: profile.id, type: 'refresh' }, env.JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });

    return {
      access_token,
      refresh_token,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      token_type: 'bearer',
      user: { id: profile.id, phone: profile.phone || '' },
    };
  }

  /** Verifies a refresh token and issues a fresh session, or throws. */
  static async refreshSession(refreshToken: string): Promise<IssuedSession> {
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET);
    } catch (e) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
    if (decoded?.type !== 'refresh' || !decoded.sub) {
      throw new AuthenticationError('Not a valid refresh token');
    }
    const profile = await AuthRepository.findProfileById(decoded.sub);
    if (!profile) throw new AuthenticationError('Profile no longer exists');
    return this.issueSession(profile);
  }

  static async verifyTokenAndGetProfile(token: string): Promise<Profile> {
    const result = await this.verifyTokenWithDetails(token);
    return result.profile;
  }

  static async verifyTokenWithDetails(token: string): Promise<{ profile: Profile; verificationMethod: VerificationMethod }> {
    // Layer 1: Dev Token / Dev Signature verification (ONLY in non-production
    // environments with ALLOW_DEV_BYPASS) — checked first since its tokens
    // are deliberately unsigned and would fail real JWT verification below.
    const isDevEnv = env.NODE_ENV !== 'production';
    if (isDevEnv && (token.includes('dev_signature') || env.ALLOW_DEV_BYPASS === 'true')) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

          if (payload.exp && Date.now() >= payload.exp * 1000) {
            throw new AuthenticationError('Token has expired');
          }

          let userId = payload.sub;
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const phone = payload.phone || '';

          if (!userId || !uuidRegex.test(userId)) {
            if (phone) {
              const cleanPhoneDigits = phone.replace(/[^0-9]/g, '').slice(-12).padStart(12, '0');
              userId = `00000000-0000-4000-8000-${cleanPhoneDigits}`;
            } else {
              throw new AuthenticationError('Invalid token identity');
            }
          }

          const profile = await this.syncProfile(userId, phone);
          return { profile, verificationMethod: 'DEV_BYPASS' };
        }
      } catch (devErr: any) {
        if (devErr instanceof AuthenticationError) {
          throw devErr;
        }
        console.warn('[AuthService] Dev token decode failed:', devErr);
      }
    }

    // Layer 2: Local cryptographic JWT verification — the only real path now
    // that Supabase Auth is gone. Rejects refresh tokens explicitly so one
    // can't be used as an access token.
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded?.type === 'refresh') {
        throw new AuthenticationError('Refresh tokens cannot be used as access tokens');
      }
      if (decoded && decoded.sub) {
        const profile = await this.syncProfile(decoded.sub, decoded.phone || '');
        return { profile, verificationMethod: 'LOCAL_JWT' };
      }
    } catch (jwtErr: any) {
      if (jwtErr instanceof AuthenticationError) throw jwtErr;
      console.warn('[AuthService] Local JWT verification failed:', jwtErr?.message || jwtErr);
    }

    throw new AuthenticationError('Invalid or expired token');
  }

  /**
   * Admin login is the one password-based flow in an otherwise phone-OTP
   * app. Previously delegated to supabase.auth.signInWithPassword, which
   * depended on Supabase Auth owning the password itself — now checked
   * against profiles.password_hash (bcrypt), set via
   * crm.controller.ts#resetUserPassword.
   */
  static async adminLogin(email: string, password: string): Promise<{ session: IssuedSession; profile: Profile }> {
    const profile = await AuthRepository.findProfileByEmail(email);
    if (!profile || !profile.password_hash) {
      throw new AuthenticationError('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, profile.password_hash);
    if (!passwordMatches) {
      throw new AuthenticationError('Invalid email or password');
    }

    const adminRoles = [
      'admin',
      'super_admin',
      'ops',
      'operations_manager',
      'operations_executive',
      'support',
      'customer_support',
      'finance_manager',
      'trust_safety',
      'marketing_manager',
      'delivery_manager',
    ];

    if (!adminRoles.includes((profile.role || '').toLowerCase())) {
      throw new AuthorizationError('Access denied: Ops or admin permissions required');
    }

    return { session: this.issueSession(profile), profile };
  }
}
