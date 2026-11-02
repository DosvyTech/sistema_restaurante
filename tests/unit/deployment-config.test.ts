import { describe, expect, it } from "vitest";

import { validateDeploymentConfiguration } from "../../scripts/deployment-config.mjs";

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
