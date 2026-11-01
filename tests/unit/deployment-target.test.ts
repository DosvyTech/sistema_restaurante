import { describe, expect, it } from "vitest";

import { validateDeploymentTarget } from "../../scripts/deployment-target.mjs";

function databaseUrl(host: string, database = "dosvy_cafe_01") {
  const url = new URL("postgresql://postgres");
  url.username = "dosvy_owner";
  url.password = "synthetic-password";
  url.hostname = host;
  url.port = "5432";
  url.pathname = `/${database}`;
  return url.toString();
}

function urlWithoutCredentials() {
  const url = new URL("postgresql://postgres");
  url.port = "5432";
  url.pathname = "/dosvy_cafe_01";
  return url.toString();
}

describe("validateDeploymentTarget", () => {
  const validTarget = {
    databaseUrl: databaseUrl("postgres"),
    installationId: "cafe_01",
    confirmation: "cafe_01",
  };

  it("accepts only the confirmed installation database on the private postgres service", () => {
    expect(validateDeploymentTarget(validTarget).hostname).toBe("postgres");
  });

  it("rejects a missing or mismatched operator confirmation", () => {
    expect(() =>
      validateDeploymentTarget({ ...validTarget, confirmation: "another_installation" }),
    ).toThrow(/confirmation/i);
  });

  it("rejects loopback and remote database hosts", () => {
    for (const host of ["127.0.0.1", "localhost", "db.example.test"]) {
      expect(() =>
        validateDeploymentTarget({
          ...validTarget,
          databaseUrl: databaseUrl(host),
        }),
      ).toThrow(/private postgres service/i);
    }
  });

  it("rejects a database name that is not scoped to the installation", () => {
    expect(() =>
      validateDeploymentTarget({
        ...validTarget,
        databaseUrl: databaseUrl("postgres", "dosvy_dev"),
      }),
    ).toThrow(/installation database/i);
  });

  it("rejects invalid installation identifiers and URLs without credentials", () => {
    expect(() =>
      validateDeploymentTarget({ ...validTarget, installationId: "../cafe" }),
    ).toThrow(/installation identifier/i);
    expect(() =>
      validateDeploymentTarget({
        ...validTarget,
        databaseUrl: urlWithoutCredentials(),
      }),
    ).toThrow(/credentials/i);
  });
});
