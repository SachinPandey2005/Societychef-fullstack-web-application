import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { clearCachedToken } from '../middleware/auth.middleware';
import { getSmsProvider } from '../services/sms';
import { updateAuthProfileSchema, sendOtpSchema, verifyOtpSchema, adminLoginSchema } from '../validators/auth.schema';
import { db } from '../db/client';
import { profiles, kitchens } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import crypto from 'crypto';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // req.user is guaranteed to exist due to requireAuth middleware. Resolved
  // so the mobile app's session-restore gets chef/kitchen linkage in the
  // same shape verify-otp returns, instead of the raw profile row.
  const resolved = await AuthService.resolveSessionUser(req.user);
  sendSuccess(res, 'Authenticated user retrieved successfully', resolved);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  // Alias for getMe essentially, per requirements
  const resolved = await AuthService.resolveSessionUser(req.user);
  sendSuccess(res, 'Profile retrieved successfully', resolved);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { body } = updateAuthProfileSchema.parse({ body: req.body });

  // `name` and `display_name` have always been kept in lockstep (mobile's
  // profile name editor writes both) — mirror that here since display_name
  // is what resolveSessionUser/getMe actually surfaces to the app.
  const payload = body.name ? { ...body, display_name: body.name } : body;

  // Use the profile service from Phase 3 to perform the update
  const updatedProfile = await ProfileService.updateProfile(req.user!.id, payload);

  // requireAuth caches the resolved profile per-token for 5 minutes (see
  // auth.middleware.ts) — without invalidating it here, getMe/getProfile
  // (and every other authenticated request on this token) would keep
  // serving the pre-update snapshot until the cache naturally expires.
  const token = req.headers.authorization?.split(' ')[1];
  if (token) clearCachedToken(token);

  sendSuccess(res, 'Profile updated successfully', updatedProfile);
});

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { body } = sendOtpSchema.parse({ body: req.body });

  // In development / QA testing mode with ALLOW_DEV_BYPASS enabled, skip external SMS provider
  if (env.ALLOW_DEV_BYPASS === 'true') {
    return sendSuccess(res, 'OTP sent successfully (Development Test OTP: 12345 or 123456)');
  }

  try {
    await getSmsProvider().sendOtp(body.phone);
  } catch (error: any) {
    // Fallback for non-production environments if the SMS gateway fails
    if (env.NODE_ENV !== 'production') {
      return sendSuccess(res, 'OTP sent successfully (Development Fallback OTP: 12345 or 123456)');
    }
    throw new AppError(error.message || 'Failed to send OTP', 400);
  }

  sendSuccess(res, 'OTP sent successfully');
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { body } = verifyOtpSchema.parse({ body: req.body });

  // Fixed test OTP verification in development / QA mode
  const isTestOtp = body.token === '12345' || body.token === '123456';
  if ((env.ALLOW_DEV_BYPASS === 'true' || env.NODE_ENV !== 'production') && isTestOtp) {
    const cleanPhoneDigits = body.phone.replace(/[^0-9]/g, '').slice(-12).padStart(12, '0');
    const devUserId = `00000000-0000-4000-8000-${cleanPhoneDigits}`;
    const profile = await AuthService.syncProfile(devUserId, body.phone);

    const payload = {
      sub: profile.id,
      phone: body.phone,
      role: profile.role || 'DELIVERY_PARTNER',
      exp: Math.floor(Date.now() / 1000) + 86400 * 30,
    };
    const devToken = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.dev_signature`;

    await SessionService.registerSession(profile.id, devToken);

    return sendSuccess(res, 'OTP verified successfully', {
      session: {
        access_token: devToken,
        refresh_token: 'dev_refresh_token',
        expires_in: 86400 * 30,
        token_type: 'bearer',
        user: {
          id: profile.id,
          phone: body.phone,
        },
      },
      user: await AuthService.resolveSessionUser(profile),
    });
  }

  const verified = await getSmsProvider().verifyOtp(body.phone, body.token);
  if (!verified) {
    throw new AppError('Verification failed', 400);
  }

  // Resolve (or create) the profile for this phone number — there's no
  // Supabase Auth user id to key off anymore, so the profile's own id is
  // generated here the first time a phone number is seen.
  const byPhoneRows = await db.select().from(profiles).where(eq(profiles.phone, body.phone)).limit(1);
  const userId = byPhoneRows[0]?.id || crypto.randomUUID();

  const profile = await AuthService.syncProfile(userId, body.phone);
  const session = AuthService.issueSession(profile);

  await SessionService.registerSession(profile.id, session.access_token);

  const resolvedUser = await AuthService.resolveSessionUser(profile);
  sendSuccess(res, 'OTP verified successfully', { session, user: resolvedUser });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (token) {
    await SessionService.revokeSession(token);
    clearCachedToken(token);
  }
  sendSuccess(res, 'Logged out successfully');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw new AppError('Refresh token is required', 400);
  }

  const session = await AuthService.refreshSession(refresh_token);
  await SessionService.registerSession(session.user.id, session.access_token);

  sendSuccess(res, 'Token refreshed successfully', { session });
});

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { body } = adminLoginSchema.parse({ body: req.body });

  const { session, profile } = await AuthService.adminLogin(body.email, body.password);

  await SessionService.registerSession(profile.id, session.access_token);

  // Never echo the bcrypt hash back to the client.
  const { password_hash, ...safeProfile } = profile as any;

  sendSuccess(res, 'Admin login successful', {
    session,
    profile: safeProfile
  });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    await SessionService.revokeSession(token);
    clearCachedToken(token);
  }

  // Soft delete / deactivate profile in database. status is the real column
  // that the rest of the app (and requireAuth's suspension check) actually
  // reads — is_suspended/updated_at were never real columns on profiles.
  await db.update(profiles).set({ status: 'DELETED' }).where(eq(profiles.id, userId));

  // A chef's kitchen must stop appearing in discovery too — otherwise a
  // "deleted" account's dishes would stay orderable. This used to be mobile's
  // job (deleting kitchen/dish rows directly in Supabase), which stopped
  // doing anything once those tables moved to Drizzle/local Postgres; hard
  // deleting here instead would orphan any FK referencing this kitchen (past
  // orders, reviews), so pausing it (is_live = false) is the real backend
  // equivalent of what mobile actually intended.
  await db.update(kitchens).set({ isLive: false }).where(eq(kitchens.chefUserId, userId));

  sendSuccess(res, 'Account deleted successfully');
});
