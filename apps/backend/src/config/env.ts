import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8080').transform(Number),
  // Legacy — config/supabase.ts still constructs a client at module load for
  // ~32 not-yet-converted admin/reporting/ops files (everything consumer/chef
  // -facing already reads DATABASE_URL via Drizzle instead). Defaulted rather
  // than required so a real deploy (e.g. Railway, pointed at Neon) never
  // needs to supply real or placeholder Supabase config just to boot — these
  // defaults are deliberately non-functional stand-ins, not real credentials.
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').default('http://localhost:0'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required').default('unused'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').default('unused'),
  SUPABASE_JWT_SECRET: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  // Supabase->Neon migration: most repositories (consumer/chef-facing — orders,
  // chat, wallet, kitchens, etc.) already read this via Drizzle. Still optional
  // because the ~32 admin/reporting/ops files above haven't converted yet —
  // becomes required once they do and SUPABASE_* above can be deleted entirely.
  DATABASE_URL: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_ENV: z.enum(['SANDBOX', 'PRODUCTION', 'TEST', 'sandbox', 'production', 'test']).default('SANDBOX').transform((val) => val.toUpperCase() as 'SANDBOX' | 'PRODUCTION' | 'TEST'),
  CASHFREE_API_VERSION: z.string().default('2023-08-01'),
  CASHFREE_RETURN_URL: z.string().default('rasohi://payment-return'),
  CASHFREE_WEBHOOK_URL: z.string().optional(),
  ALLOW_DEV_BYPASS: z.string().default('false'),
  // Phase 2 of the Supabase->Neon migration: MSG91 replaces Supabase Auth
  // for phone OTP. Both optional — without them, SmsProviderFactory falls
  // back to a console-log provider so local dev keeps working without a
  // real MSG91 account, same spirit as ALLOW_DEV_BYPASS above.
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  // Phase 5 of the Supabase->Neon migration: Cloudflare R2 replaces Supabase
  // Storage for file uploads. Optional, same spirit as MSG91 above — without
  // these, StorageService throws a clear error only when an upload/delete is
  // actually attempted, rather than crashing every environment at startup.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  // The bucket's public base URL (R2.dev dev subdomain or a custom domain),
  // no trailing slash.
  R2_PUBLIC_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const errorMsg = '❌ Invalid environment variables:\n' + JSON.stringify(_env.error.format());
  console.error(errorMsg);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  } else {
    throw new Error(errorMsg);
  }
}

export const env = _env.data;
