import { sql } from 'drizzle-orm';
import { db } from '../../../shared/db';
import { HealthCheckResult } from '../../../shared/types/health.types';

export async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error',
      responseTime: Date.now() - start,
    };
  }
}
