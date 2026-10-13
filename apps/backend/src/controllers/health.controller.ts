import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { logger } from '../utils/logger';

export const getHealthStatus = async (req: Request, res: Response) => {
  try {
    // Check DB connection — the real database every converted endpoint
    // actually reads/writes (Drizzle/local Postgres, Neon post-cutover),
    // not Supabase: pinging Supabase here would have reported "UP" even if
    // the real database was unreachable, and "DOWN" on a harmless Supabase
    // outage that doesn't affect the app at all.
    await db.execute(sql`SELECT 1`);

    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: 'UP',
        cache: 'UP (IN_MEMORY)',
        queue: 'UP (EVENT_BUS)'
      }
    });
  } catch (err: any) {
    logger.error('Health check failed', err);
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
};
