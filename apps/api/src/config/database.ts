import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Global singleton declaration to prevent connection exhaustion during development restarts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export interface DatabaseHealthResult {
  status: 'connected' | 'disconnected';
  latencyMs?: number;
  error?: string;
}

/**
 * Validates active database connectivity with a bounded timeout.
 * Never throws an uncaught error.
 */
export async function checkDatabaseHealth(timeoutMs = 2500): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  try {
    const queryPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database health check timed out')), timeoutMs)
    );

    await Promise.race([queryPromise, timeoutPromise]);
    return {
      status: 'connected',
      latencyMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database connectivity error';
    return {
      status: 'disconnected',
      error: message,
    };
  }
}

/**
 * Safely disconnects the Prisma client connection pool.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database connection pool disconnected cleanly.');
  } catch (err) {
    console.error('Error disconnecting database connection pool:', err);
  }
}
