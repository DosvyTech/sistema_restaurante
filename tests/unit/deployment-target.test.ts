import { describe, expect, it } from "vitest";

import { validateDeploymentTarget } from "../../scripts/deployment-target.mjs";

describe("validateDeploymentTarget", () => {
  const validTarget = {
    databaseUrl: "postgresql://dosvy_owner:synthetic-password@postgres:5432/dosvy_cafe_01",
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
          databaseUrl: `postgresql://dosvy_owner:synthetic-password@${host}:5432/dosvy_cafe_01`,
        }),
      ).toThrow(/private postgres service/i);
    }
  });

  it("rejects a database name that is not scoped to the installation", () => {
    expect(() =>
      validateDeploymentTarget({
        ...validTarget,
        databaseUrl: "postgresql://dosvy_owner:synthetic-password@postgres:5432/dosvy_dev",
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
        databaseUrl: "postgresql://postgres:5432/dosvy_cafe_01",
      }),
    ).toThrow(/credentials/i);
  });
});
