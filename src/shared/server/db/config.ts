import "server-only";

export interface DatabaseEnvironment {
  [key: string]: string | undefined;
  DATABASE_URL?: string;
  TEST_DATABASE_URL?: string;
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function parsePostgresUrl(value: string | undefined, variable: string): URL {
  if (!value?.trim()) {
    throw new Error(`${variable} is required for this database operation.`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variable} must be a valid PostgreSQL connection URL.`);
  }

  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname ||
    url.pathname === "/"
  ) {
    throw new Error(`${variable} must be a valid PostgreSQL connection URL.`);
  }

  return url;
}

function databaseName(url: URL, variable: string): string {
  let name: string;
  try {
    name = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new Error(`${variable} must identify one database.`);
  }

  if (!name || name.includes("/")) {
    throw new Error(`${variable} must identify one database.`);
  }

  return name;
}

function databaseHost(url: URL): string {
  const host = url.hostname.toLowerCase();
  return localHosts.has(host) ? "loopback" : host;
}

function hasSameDatabaseTarget(left: URL, right: URL): boolean {
  return (
    databaseHost(left) === databaseHost(right) &&
    (left.port || "5432") === (right.port || "5432") &&
    databaseName(left, "DATABASE_URL") ===
      databaseName(right, "TEST_DATABASE_URL")
  );
}

export function getDatabaseUrl(
  environment: DatabaseEnvironment = process.env,
): string {
  return parsePostgresUrl(environment.DATABASE_URL, "DATABASE_URL").toString();
}

export function getLocalDatabaseUrl(
  environment: DatabaseEnvironment = process.env,
): string {
  const url = parsePostgresUrl(environment.DATABASE_URL, "DATABASE_URL");
  const host = url.hostname.toLowerCase();
  const name = databaseName(url, "DATABASE_URL");

  if (!localHosts.has(host)) {
    throw new Error("DATABASE_URL must use a loopback host for local migrations.");
  }

  if (!/^dosvy_(?:dev|test)(?:_[a-z0-9]+)*$/i.test(name)) {
    throw new Error(
      "DATABASE_URL must target a local dosvy_dev* or dosvy_test* database for migrations.",
    );
  }

  return url.toString();
}

export function getTestDatabaseUrl(
  environment: DatabaseEnvironment = process.env,
): string {
  const testUrl = parsePostgresUrl(
    environment.TEST_DATABASE_URL,
    "TEST_DATABASE_URL",
  );
  const testHost = testUrl.hostname.toLowerCase();
  const testName = databaseName(testUrl, "TEST_DATABASE_URL");

  if (!localHosts.has(testHost)) {
    throw new Error("TEST_DATABASE_URL must use a loopback host.");
  }

  if (!/^dosvy_test(?:_[a-z0-9]+)*$/i.test(testName)) {
    throw new Error(
      "TEST_DATABASE_URL must target a database named dosvy_test or dosvy_test_*.",
    );
  }

  if (environment.DATABASE_URL) {
    const applicationUrl = parsePostgresUrl(
      environment.DATABASE_URL,
      "DATABASE_URL",
    );
    if (hasSameDatabaseTarget(applicationUrl, testUrl)) {
      throw new Error(
        "TEST_DATABASE_URL must be separate from DATABASE_URL.",
      );
    }
  }

  return testUrl.toString();
}
