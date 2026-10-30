import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";
import { getDatabaseUrl } from "./config";

export type AppDatabase = NodePgDatabase<typeof schema>;

export interface DatabaseContext {
  db: AppDatabase;
  pool: Pool;
  close: () => Promise<void>;
}

interface SharedDatabaseContext extends DatabaseContext {
  connectionString: string;
}

type DatabaseGlobal = typeof globalThis & {
  __dosvyDatabaseContext?: SharedDatabaseContext;
};

const databaseGlobal = globalThis as DatabaseGlobal;

export function createDatabaseContext(
  connectionString: string,
  applicationName = "dosvy-restaurante",
): DatabaseContext {
  const pool = new Pool({
    connectionString,
    application_name: applicationName,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  return {
    pool,
    db: drizzle({ client: pool, schema }),
    close: () => pool.end(),
  };
}

export function getDatabaseContext(): DatabaseContext {
  const connectionString = getDatabaseUrl();
  const existing = databaseGlobal.__dosvyDatabaseContext;

  if (existing && existing.connectionString !== connectionString) {
    throw new Error(
      "DATABASE_URL cannot change while the database pool is active.",
    );
  }

  if (existing) {
    return existing;
  }

  const context = {
    ...createDatabaseContext(connectionString),
    connectionString,
  };
  databaseGlobal.__dosvyDatabaseContext = context;
  return context;
}

export function getDb(): AppDatabase {
  return getDatabaseContext().db;
}

export function getPool(): Pool {
  return getDatabaseContext().pool;
}

export async function closeDatabase(): Promise<void> {
  const context = databaseGlobal.__dosvyDatabaseContext;
  if (!context) return;

  delete databaseGlobal.__dosvyDatabaseContext;
  await context.close();
}
