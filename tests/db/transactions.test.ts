import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import { createTestDatabaseContext } from "../../src/shared/server/db/test-context";

const schema = `chg003_test_${randomUUID().replaceAll("-", "")}`;
const context = createTestDatabaseContext();

function fixtureSql(statement: string): ReturnType<typeof sql.raw> {
  return sql.raw(statement);
}

async function countRows(table: "parents" | "children"): Promise<number> {
  const result = await context.db.execute(
    fixtureSql(`SELECT count(*)::int AS count FROM "${schema}"."${table}"`),
  );
  return result.rows[0]?.count as number;
}

function hasSqlState(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === code) return true;
  return "cause" in error && hasSqlState(error.cause, code);
}

before(async () => {
  await context.db.execute(fixtureSql(`CREATE SCHEMA "${schema}"`));
  await context.db.execute(
    fixtureSql(
      `CREATE TABLE "${schema}"."parents" (id text PRIMARY KEY);`,
    ),
  );
  await context.db.execute(
    fixtureSql(
      `CREATE TABLE "${schema}"."children" (id text PRIMARY KEY, parent_id text NOT NULL REFERENCES "${schema}"."parents"(id) ON DELETE RESTRICT);`,
    ),
  );
});

after(async () => {
  try {
    await context.db.execute(
      fixtureSql(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`),
    );
  } finally {
    await context.close();
  }
});

test("commits parent and child writes through one transaction context", async () => {
  await context.withTransaction(async (tx) => {
    await tx.execute(
      fixtureSql(`INSERT INTO "${schema}"."parents" (id) VALUES ('committed-parent')`),
    );
    await tx.execute(
      fixtureSql(
        `INSERT INTO "${schema}"."children" (id, parent_id) VALUES ('committed-child', 'committed-parent')`,
      ),
    );
  });

  assert.equal(await countRows("parents"), 1);
  assert.equal(await countRows("children"), 1);
});

test("rolls back all earlier writes when a callback fails midway", async () => {
  await assert.rejects(
    context.withTransaction(async (tx) => {
      await tx.execute(
        fixtureSql(`INSERT INTO "${schema}"."parents" (id) VALUES ('rolled-back-parent')`),
      );
      await tx.execute(
        fixtureSql(
          `INSERT INTO "${schema}"."children" (id, parent_id) VALUES ('rolled-back-child', 'rolled-back-parent')`,
        ),
      );
      throw new Error("intentional rollback probe");
    }),
    /intentional rollback probe/,
  );

  assert.equal(await countRows("parents"), 1);
  assert.equal(await countRows("children"), 1);
});

test("PostgreSQL rejects a child row with a missing parent", async () => {
  await assert.rejects(
    context.db.execute(
      fixtureSql(
        `INSERT INTO "${schema}"."children" (id, parent_id) VALUES ('invalid-child', 'missing-parent')`,
      ),
    ),
    (error: unknown) => hasSqlState(error, "23503"),
  );

  assert.equal(await countRows("children"), 1);
});
