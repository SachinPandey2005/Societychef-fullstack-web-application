// Drizzle's introspected schema exposes camelCase field names (mapped to the
// real snake_case DB columns), but every existing repository/controller/type
// in this codebase was written against raw snake_case rows (that's what
// `supabase.from(...).select('*')` always returned). Converting at the DB
// boundary — here, once — means no caller anywhere else has to change as
// repositories get migrated from supabase-js to Drizzle one file at a time.
//
// Deliberately shallow: jsonb columns (kitchen_info, story_prompts, etc.)
// hold app-defined keys that must never be rewritten, so only the row's own
// top-level keys are converted, never values.

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function rowToSnakeCase<T = Record<string, any>>(row: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    out[camelToSnake(key)] = row[key];
  }
  return out as T;
}

export function rowsToSnakeCase<T = Record<string, any>>(rows: Record<string, any>[]): T[] {
  return rows.map((row) => rowToSnakeCase<T>(row));
}

export function toCamelCaseInput<T = Record<string, any>>(payload: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const key of Object.keys(payload)) {
    out[snakeToCamel(key)] = payload[key];
  }
  return out as T;
}
