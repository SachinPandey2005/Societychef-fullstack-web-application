import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env';
import * as schema from './schema';
import * as relations from './relations';

// DATABASE_URL points at local Postgres during the Supabase->Neon migration
// (Phase 1) and at the real Neon connection string once cutover happens
// (Phase 6) — nothing else in this file changes between the two. No fallback
// here deliberately: a converted repository silently talking to someone's
// local database in production would be worse than a loud startup failure.
if (!env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Repositories converted to Drizzle (see src/repositories) cannot run without it.'
  );
}

const pool = new Pool({ connectionString: env.DATABASE_URL });

// Exported so test teardown (jest.setup.ts) can close it — Jest otherwise
// force-exits with an open-handle warning, since this pool has no natural
// close point in a long-running server.
export { pool };
export const db = drizzle(pool, { schema: { ...schema, ...relations } });
