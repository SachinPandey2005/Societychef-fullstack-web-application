import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { profiles } from '../src/db/schema';

// Creates (or resets the password on) the admin@gmail.com fixture account
// tests/api/admin-auth.api.test.ts expects to exist. Rewritten from the
// original Supabase Auth (GoTrue) version — admin login now checks bcrypt
// against profiles.password_hash directly (see AuthService#adminLogin),
// GoTrue is gone as of the Phase 2 Supabase->Neon migration work.
async function bootstrapAdmin() {
  const email = 'admin@gmail.com';
  const password = 'Admin@1234';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);

  if (existing[0]) {
    console.log(`Profile ${email} already exists (id: ${existing[0].id}). Updating password/role...`);
    await db.update(profiles).set({
      role: 'admin',
      status: 'active',
      passwordHash,
    }).where(eq(profiles.id, existing[0].id));
    console.log('Successfully updated admin profile.');
  } else {
    console.log(`Profile ${email} does not exist. Creating it...`);
    await db.insert(profiles).values({
      email,
      phone: '+919999999999',
      name: 'Production Admin',
      role: 'admin',
      roles: ['admin'],
      status: 'active',
      passwordHash,
    });
    console.log('Successfully created admin profile.');
  }

  console.log(`Done. Login with email=${email} password=${password}.`);
  process.exit(0);
}

bootstrapAdmin().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
