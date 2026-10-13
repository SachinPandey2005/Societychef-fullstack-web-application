import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { profiles } from '../db/schema';
import { rowToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Profile } from '../types/profile';

export class AuthRepository {
  static async findProfileById(id: string): Promise<Profile | null> {
    const rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<Profile>(rows[0]) : null;
  }

  static async createProfile(profile: Partial<Profile>): Promise<Profile> {
    const rows = await db.insert(profiles).values(toCamelCaseInput(profile) as any).returning();
    return rowToSnakeCase<Profile>(rows[0]);
  }

  static async findProfileByRole(role: string): Promise<Profile | null> {
    const rows = await db.select().from(profiles).where(eq(profiles.role, role)).limit(1);
    return rows[0] ? rowToSnakeCase<Profile>(rows[0]) : null;
  }

  static async findProfileByEmail(email: string): Promise<Profile | null> {
    const rows = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    return rows[0] ? rowToSnakeCase<Profile>(rows[0]) : null;
  }
}
