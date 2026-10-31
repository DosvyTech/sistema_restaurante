import "server-only";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { closeDatabase, getDatabaseContext } from "../src/shared/server/db/client";
import { getLocalDatabaseUrl } from "../src/shared/server/db/config";

async function main(): Promise<void> {
  getLocalDatabaseUrl();
  const context = getDatabaseContext();

  try {
    await migrate(context.db, { migrationsFolder: "./drizzle" });
  } catch (error) {
    const code =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string" &&
      /^\d{5}$/.test(error.code)
        ? ` (PostgreSQL SQLSTATE ${error.code})`
        : "";
    console.error(
      `Database migration failed${code}. Check the local PostgreSQL service and migration files.`,
    );
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

void main();
