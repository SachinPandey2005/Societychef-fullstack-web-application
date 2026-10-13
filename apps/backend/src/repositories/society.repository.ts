import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { societies } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { Society, CreateSocietyInput, UpdateSocietyInput } from '../types/society';

export class SocietyRepository {
  static async findAll(): Promise<Society[]> {
    const rows = await db.select().from(societies);
    return rowsToSnakeCase<Society>(rows);
  }

  static async findById(id: string): Promise<Society | null> {
    const rows = await db.select().from(societies).where(eq(societies.id, id)).limit(1);
    return rows[0] ? rowToSnakeCase<Society>(rows[0]) : null;
  }

  static async create(payload: CreateSocietyInput): Promise<Society> {
    const rows = await db.insert(societies).values(toCamelCaseInput(payload) as any).returning();
    return rowToSnakeCase<Society>(rows[0]);
  }

  static async update(id: string, payload: UpdateSocietyInput): Promise<Society | null> {
    const rows = await db.update(societies).set(toCamelCaseInput(payload) as any).where(eq(societies.id, id)).returning();
    return rows[0] ? rowToSnakeCase<Society>(rows[0]) : null;
  }

  static async delete(id: string): Promise<boolean> {
    await db.delete(societies).where(eq(societies.id, id));
    return true;
  }
}
