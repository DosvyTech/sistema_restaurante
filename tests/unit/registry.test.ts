import { describe, expect, it } from "vitest";

import { plannedModules } from "../../src/modules/registry";

const expectedModuleIds = [
  "MOD-01",
  "MOD-02",
  "MOD-03",
  "MOD-04",
  "MOD-05",
  "MOD-08",
  "MOD-09",
] as const;

describe("planned module registry", () => {
  it("contains exactly the seven approved module identifiers", () => {
    const moduleIds = plannedModules.map(({ id }) => id);

    expect(moduleIds).toEqual(expectedModuleIds);
    expect(new Set(moduleIds).size).toBe(moduleIds.length);
  });

  it("keeps every catalog entry explicitly planned", () => {
    expect(plannedModules).toHaveLength(expectedModuleIds.length);
    expect(plannedModules.every(({ status }) => status === "planned")).toBe(true);
  });
});
