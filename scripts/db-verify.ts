import "server-only";

import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { getTestDatabaseUrl } from "../src/shared/server/db/config";

const migrationFolder = "./drizzle";

function safeSqlState(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    /^\d{5}$/.test(error.code)
  ) {
    return ` (PostgreSQL SQLSTATE ${error.code})`;
  }
  return "";
}

async function verifyDatabase(connectionString: string, reapply: boolean) {
  const pool = new Pool({
    connectionString,
    application_name: "dosvy-chg003-migration-verify",
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const db = drizzle({ client: pool });
    await migrate(db, { migrationsFolder: migrationFolder });

    const schema = await pool.query<{ schema_name: string }>(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'app'",
    );
    if (schema.rowCount !== 1) {
      throw new Error("The foundation migration did not create schema app.");
    }

    const migrations = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM drizzle.__drizzle_migrations",
    );
    const appliedCount = migrations.rows[0]?.count;
    if (appliedCount !== "1") {
      throw new Error("Expected exactly one versioned foundation migration.");
    }

    if (reapply) {
      await migrate(db, { migrationsFolder: migrationFolder });
      const reapplied = await pool.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM drizzle.__drizzle_migrations",
      );
      if (reapplied.rows[0]?.count !== appliedCount) {
        throw new Error("Migration reapplication changed the migration ledger.");
      }
    }
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const testUrl = new URL(getTestDatabaseUrl());
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";

  const runId = randomBytes(8).toString("hex");
  const databaseNames = [
    `dosvy_test_chg003_${runId}_a`,
    `dosvy_test_chg003_${runId}_b`,
  ];
  const adminPool = new Pool({
    connectionString: adminUrl.toString(),
    application_name: "dosvy-chg003-test-database-admin",
    max: 1,
    connectionTimeoutMillis: 5_000,
  });
  const createdDatabases: string[] = [];

  try {
    const privilege = await adminPool.query<{ rolcreatedb: boolean }>(
      "SELECT rolcreatedb FROM pg_roles WHERE rolname = current_user",
    );
    if (privilege.rows[0]?.rolcreatedb !== true) {
      throw new Error("The local test role must have CREATEDB for disposable checks.");
    }

    for (const [index, databaseName] of databaseNames.entries()) {
      await adminPool.query(`CREATE DATABASE "${databaseName}"`);
      createdDatabases.push(databaseName);

      const databaseUrl = new URL(testUrl);
      databaseUrl.pathname = `/${databaseName}`;
      await verifyDatabase(databaseUrl.toString(), index === 0);
    }

    const result = spawnSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--env-file-if-exists=.env",
        "--import",
        "tsx",
        "--test",
        "tests/db/config.test.ts",
        "tests/db/transactions.test.ts",
      ],
      { stdio: "inherit", env: process.env },
    );
    if (result.error || result.status !== 0) {
      throw new Error("The PostgreSQL integrity test suite did not pass.");
    }
  } finally {
    for (const databaseName of createdDatabases.reverse()) {
      await adminPool.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    }
    await adminPool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(`Database verification failed${safeSqlState(error)}.`);
  process.exitCode = 1;
});
