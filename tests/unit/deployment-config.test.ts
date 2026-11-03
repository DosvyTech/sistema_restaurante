import { describe, expect, it } from "vitest";

import { validateDeploymentConfiguration, validatePgBackRestConfiguration } from "../../scripts/deployment-config.mjs";

function databaseUrl(password: string, database = "dosvy_restaurant_01") {
  const url = new URL("postgresql://postgres");
  url.username = "dosvy_owner";
  url.password = password;
  url.hostname = "postgres";
  url.port = "5432";
  url.pathname = `/${database}`;
  return url.toString();
}

const validConfiguration = {
  installationId: "restaurant_01",
  composeProject: "dosvy-restaurant-01",
  databaseName: "dosvy_restaurant_01",
  databaseUser: "dosvy_owner",
  domain: "restaurant.example.com",
  appImage: `ghcr.io/dosvytech/sistema_restaurante:release@sha256:${"a".repeat(64)}`,
  postgresImage: `postgres:18.6-alpine@sha256:${"b".repeat(64)}`,
  caddyImage: `caddy:2.10.2-alpine@sha256:${"c".repeat(64)}`,
  databaseUrl: databaseUrl("synthetic-password"),
  postgresPassword: "synthetic-password",
};

describe("validateDeploymentConfiguration", () => {
  it("accepts a consistent, digest-pinned installation configuration", () => {
    expect(validateDeploymentConfiguration(validConfiguration)).toEqual({
      installationId: "restaurant_01",
      composeProject: "dosvy-restaurant-01",
      databaseName: "dosvy_restaurant_01",
      domain: "restaurant.example.com",
    });
  });

  it("rejects project or database names that are not scoped to the installation", () => {
    expect(() =>
      validateDeploymentConfiguration({ ...validConfiguration, composeProject: "dosvy-other" }),
    ).toThrow(/project name/i);
    expect(() =>
      validateDeploymentConfiguration({ ...validConfiguration, databaseName: "dosvy_dev" }),
    ).toThrow(/database name/i);
  });

  it("rejects mutable container image references", () => {
    expect(() =>
      validateDeploymentConfiguration({ ...validConfiguration, appImage: "dosvy-app:latest" }),
    ).toThrow(/digest/i);
  });

  it("rejects an invalid public domain", () => {
    expect(() =>
      validateDeploymentConfiguration({ ...validConfiguration, domain: "localhost" }),
    ).toThrow(/domain/i);
  });

  it("rejects database credentials or target that do not match the installation", () => {
    expect(() =>
      validateDeploymentConfiguration({
        ...validConfiguration,
        databaseUrl: databaseUrl("wrong-password"),
      }),
    ).toThrow(/password file/i);
  });
});

describe("validatePgBackRestConfiguration", () => {
  const config = `[global]\nrepo1-type=s3\nrepo1-path=/dosvy/restaurant_01\nrepo1-s3-bucket=private-bucket\nrepo1-s3-endpoint=s3.provider.invalid\nrepo1-s3-region=us-east-1\nrepo1-s3-key=synthetic-access\nrepo1-s3-key-secret=synthetic-secret\nrepo1-s3-uri-style=path\nrepo1-storage-port=443\nrepo1-storage-verify-tls=y\nrepo1-cipher-type=aes-256-cbc\nrepo1-cipher-pass=synthetic-key\nrepo1-retention-full-type=count\nrepo1-retention-full=2\n[restaurant_01]\npg1-path=/var/lib/postgresql/18/docker\npg1-user=dosvy_owner\n`;

  it("accepts external S3 configuration with verified TLS and encryption", () => {
    expect(validatePgBackRestConfiguration({ contents: config, installationId: "restaurant_01", databaseUser: "dosvy_owner" })).toBe(true);
  });

  it("rejects disabled TLS verification, placeholders, and mismatched stanza identity", () => {
    expect(() => validatePgBackRestConfiguration({ contents: config.replace("verify-tls=y", "verify-tls=n"), installationId: "restaurant_01", databaseUser: "dosvy_owner" })).toThrow(/requirements/i);
    expect(() => validatePgBackRestConfiguration({ contents: config.replace("synthetic-secret", "REPLACE_WITH_SECRET"), installationId: "restaurant_01", databaseUser: "dosvy_owner" })).toThrow(/configured externally/i);
    expect(() => validatePgBackRestConfiguration({ contents: config, installationId: "restaurant_02", databaseUser: "dosvy_owner" })).toThrow(/requirements/i);
  });

  it("never includes configured credential values in validation errors", () => {
    expect(() => validatePgBackRestConfiguration({ contents: config.replace("synthetic-key", ""), installationId: "restaurant_01", databaseUser: "dosvy_owner" })).toThrow("pgBackRest S3 credentials, endpoint, bucket and encryption key must be configured externally.");
  });
});
