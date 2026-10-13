import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { profiles } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Profile, CreateProfileInput, UpdateProfileInput } from '../types/profile';

// Profile's TS type claims society_id/notification_preferences/updated_at,
// none of which exist as real columns on profiles (avatar_url/cover_image
// were added for real in supabase/local/024_profile_avatar_cover.sql).
// Unlike Supabase, which would hard-error inserting an unknown column,
// Drizzle silently drops keys that don't match a real column — confirmed
// live — so the remaining phantom fields are harmless here rather than
// something to filter out.
export class ProfileRepository {
  static async findAll(): Promise<Profile[]> {
    const rows = await db.select().from(profiles);
    return rowsToSnakeCase<Profile>(rows);
  }

  static async findById(id: string): Promise<Profile | null> {
    const rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<Profile>(rows[0]) : null;
  }

  static async create(profile: CreateProfileInput): Promise<Profile> {
    const rows = await db.insert(profiles).values(toCamelCaseInput(profile) as any).returning();
    return rowToSnakeCase<Profile>(rows[0]);
  }

  static async update(id: string, payload: UpdateProfileInput): Promise<Profile | null> {
    const rows = await db.update(profiles).set(toCamelCaseInput(payload) as any).where(eq(profiles.id, id)).returning();
    return rows[0] ? rowToSnakeCase<Profile>(rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    await db.delete(profiles).where(eq(profiles.id, id));
    return true;
  }
}
