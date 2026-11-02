import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { validateDeploymentTarget } from "./deployment-target.mjs";

async function run() {
  if (process.env.DOSVY_DEPLOYMENT_MODE !== "authorized") {
    throw new Error("Set DOSVY_DEPLOYMENT_MODE=authorized for this one-time operation.");
  }

  const installationId = process.env.DOSVY_INSTALLATION_ID ?? "";
  let databaseUrl;
  try {
    databaseUrl = (await readFile("/run/secrets/database_url", "utf8")).trim();
  } catch {
    throw new Error("Deployment database URL secret is unavailable.");
  }

  const target = validateDeploymentTarget({
    databaseUrl,
    installationId,
    confirmation: process.env.DOSVY_MIGRATION_CONFIRMATION ?? "",
  });
  const pool = new Pool({
    connectionString: target.toString(),
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
  });

  let migrationLockAcquired = false;
  try {
    const lock = await pool.query(
      "SELECT pg_try_advisory_lock(hashtext($1)) AS locked",
      [`dosvy:deployment-migrations:${installationId}`],
    );
    migrationLockAcquired = lock.rows[0]?.locked === true;
    if (!migrationLockAcquired) {
      throw new Error("Another deployment migration is already running for this installation.");
    }

    await migrate(drizzle(pool), {
      migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
    });
    console.info(`Versioned migrations applied for installation ${installationId}.`);
  } catch (error) {
    const code =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string" &&
      /^\d{5}$/.test(error.code)
        ? ` (PostgreSQL SQLSTATE ${error.code})`
        : "";
    throw new Error(`Deployment migration failed${code}; inspect the migration state before retrying.`);
  } finally {
    if (migrationLockAcquired) {
      await pool.query(
        "SELECT pg_advisory_unlock(hashtext($1))",
        [`dosvy:deployment-migrations:${installationId}`],
      );
    }
    await pool.end();
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown migration error";
  console.error(message);
  process.exitCode = 1;
});
