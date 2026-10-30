import assert from "node:assert/strict";
import test from "node:test";

import {
  getDatabaseUrl,
  getLocalDatabaseUrl,
  getTestDatabaseUrl,
} from "../../src/shared/server/db/config";

test("missing application URL fails without exposing connection material", () => {
  assert.throws(
    () => getDatabaseUrl({}),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /DATABASE_URL/);
      assert.doesNotMatch(error.message, /replace-with|password|postgresql:\/\//i);
      return true;
    },
  );
});

test("test URL requires a loopback host and a clearly named test database", () => {
  const valid = {
    DATABASE_URL: "postgresql://dosvy:local-value@127.0.0.1:55432/dosvy_dev",
    TEST_DATABASE_URL:
      "postgresql://dosvy:local-value@127.0.0.1:55432/dosvy_test",
  };

  assert.equal(getTestDatabaseUrl(valid), valid.TEST_DATABASE_URL);
  assert.throws(() =>
    getTestDatabaseUrl({
      ...valid,
      TEST_DATABASE_URL:
        "postgresql://dosvy:local-value@db.example.test:55432/dosvy_test",
    }),
  );
  assert.throws(() =>
    getTestDatabaseUrl({
      ...valid,
      TEST_DATABASE_URL:
        "postgresql://dosvy:local-value@127.0.0.1:55432/dosvy_dev",
    }),
  );
});

test("test URL cannot target the same database as the application URL", () => {
  const url = "postgresql://dosvy:local-value@127.0.0.1:55432/dosvy_test";

  assert.throws(() =>
    getTestDatabaseUrl({ DATABASE_URL: url, TEST_DATABASE_URL: url }),
  );
});

test("test operations never fall back to DATABASE_URL", () => {
  assert.throws(
    () =>
      getTestDatabaseUrl({
        DATABASE_URL:
          "postgresql://dosvy:local-value@127.0.0.1:55432/dosvy_dev",
      }),
    /TEST_DATABASE_URL/,
  );
});

test("test URL rejects a production-like database name", () => {
  assert.throws(
    () =>
      getTestDatabaseUrl({
        DATABASE_URL:
          "postgresql://dosvy:local-value@127.0.0.1:55432/dosvy_dev",
        TEST_DATABASE_URL:
          "postgresql://dosvy:local-value@127.0.0.1:55432/restaurant",
      }),
    /dosvy_test/,
  );
});

test("invalid URLs return safe errors without echoing credentials", () => {
  const secret = "super-secret-value";

  assert.throws(
    () => getDatabaseUrl({ DATABASE_URL: `postgresql://${secret}` }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.doesNotMatch(error.message, new RegExp(secret));
      return true;
    },
  );
});

test("migration URL is restricted to local development and test databases", () => {
  const local = {
    DATABASE_URL: "postgresql://dosvy:local-value@127.0.0.1:55432/dosvy_dev",
  };

  assert.equal(getLocalDatabaseUrl(local), local.DATABASE_URL);
  assert.throws(() =>
    getLocalDatabaseUrl({
      DATABASE_URL:
        "postgresql://dosvy:local-value@db.example.test:55432/dosvy_dev",
    }),
  );
  assert.throws(() =>
    getLocalDatabaseUrl({
      DATABASE_URL:
        "postgresql://dosvy:local-value@127.0.0.1:55432/production",
    }),
  );
});
