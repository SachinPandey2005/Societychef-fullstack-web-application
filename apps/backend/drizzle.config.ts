import type { Config } from 'drizzle-kit';

// Points at the local Postgres database (supabase/local/*.sql already applied
// there) purely to introspect the schema into src/db/schema.ts. Once Neon is
// the real target, DATABASE_URL below just needs to point there instead —
// this file has no other purpose than driving `drizzle-kit introspect`.
export default {
  schema: './src/db/schema.ts',
  out: './src/db',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/rasohi',
  },
} satisfies Config;
