import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPool } from "../../src/shared/server/db/client";
import { GET as getReadyHealth } from "../../src/app/api/health/ready/route";

vi.mock("../../src/shared/server/db/client", () => ({
  getPool: vi.fn(),
}));

describe("readiness health route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports ready only when the database query succeeds", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ ready: 1 }] });
    vi.mocked(getPool).mockReturnValue({ query } as never);

    const response = await getReadyHealth();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready" });
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });

  it("returns a generic not-ready result without leaking database errors", async () => {
    const query = vi.fn().mockRejectedValue(new Error("synthetic credential detail"));
    vi.mocked(getPool).mockReturnValue({ query } as never);

    const response = await getReadyHealth();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "not_ready" });
    expect(response.headers.get("cache-control")).toBeNull();
  });
});
