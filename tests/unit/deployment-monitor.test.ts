import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { describe, expect, it } from "vitest";

import {
  collectOperationalIssues,
  createWalArchiveStatusCommand,
  diffOperationalIssues,
  normalizeComposeServices,
  sendAlertEvents,
} from "../../scripts/deployment-monitor.mjs";
import type { OperationalIssue } from "../../scripts/deployment-monitor.mjs";
import { GET as getLiveHealth } from "../../src/app/api/health/live/route";

describe("deployment monitor", () => {
  it("returns only a non-sensitive liveness result from the Next.js route", async () => {
    const response = await getLiveHealth();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("normalizes Compose status without retaining container identifiers or image names", () => {
    const services = normalizeComposeServices(
      JSON.stringify([
        {
          ID: "synthetic-container-id",
          Image: "postgres:synthetic-tag",
          Service: "postgres",
          State: "running",
          Health: "healthy",
        },
      ]),
    );

    expect(services).toEqual([
      { service: "postgres", state: "running", health: "healthy" },
    ]);
  });

  it("queries WAL status using the installation database identity from the container environment", () => {
    const command = createWalArchiveStatusCommand();

    expect(command).toContain('--username="$POSTGRES_USER"');
    expect(command).toContain('--dbname="$POSTGRES_DB"');
    expect(command).not.toContain("--username=postgres");
  });

  it("detects missing and unhealthy services and a backup older than its limit", () => {
    const issues = collectOperationalIssues(
      [
        { service: "postgres", state: "running", health: "healthy" },
        { service: "app", state: "running", health: "unhealthy" },
      ],
      {
        requiredServices: ["postgres", "app", "caddy"],
        backupLastSuccessAt: "2026-11-01T00:00:00.000Z",
        backupMaxAgeMs: 24 * 60 * 60 * 1000,
        walLastArchivedAt: "2026-11-01T23:30:00.000Z",
        walMaxAgeMs: 15 * 60 * 1000,
        now: Date.parse("2026-11-02T00:00:01.000Z"),
      },
    );

    expect(issues).toEqual([
      { key: "backup:stale", kind: "backup", reason: "stale" },
      { key: "service:app", kind: "service", service: "app", state: "running", health: "unhealthy" },
      { key: "service:caddy", kind: "service", service: "caddy", state: "missing", health: "unknown" },
      { key: "wal:stale", kind: "wal", reason: "stale" },
    ]);
  });

  it("raises an immediate backup failure issue independently of the age threshold", () => {
    const issues = collectOperationalIssues(
      [
        { service: "postgres", state: "running", health: "healthy" },
        { service: "app", state: "running", health: "healthy" },
        { service: "caddy", state: "running", health: "healthy" },
      ],
      {
        backupLastSuccessAt: "2026-11-02T11:59:00.000Z",
        backupMaxAgeMs: 24 * 60 * 60 * 1000,
        backupFailed: true,
        walLastArchivedAt: "2026-11-02T11:59:50.000Z",
        now: Date.parse("2026-11-02T12:00:00.000Z"),
      },
    );

    expect(issues).toEqual([{ key: "backup:failed", kind: "backup", reason: "failed" }]);
  });

  it("emits only new incidents and recoveries", () => {
    const previous = [
      { key: "service:app", kind: "service", service: "app", state: "exited", health: "unknown" },
    ] satisfies OperationalIssue[];
    const current = [
      { key: "backup:stale", kind: "backup", reason: "stale" },
    ] satisfies OperationalIssue[];

    expect(diffOperationalIssues(previous, current)).toEqual([
      { transition: "recovered", issue: previous[0] },
      { transition: "triggered", issue: current[0] },
    ]);
  });

  it("delivers a sanitized JSON alert to a synthetic loopback receiver", async () => {
    const received: string[] = [];
    const server: Server = createServer((request, response) => {
      let body = "";
      request.setEncoding("utf8");
      request.on("data", (chunk: string) => (body += chunk));
      request.on("end", () => {
        received.push(body);
        response.writeHead(204).end();
      });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Receiver did not bind");
      const receiverUrl = `http://127.0.0.1:${address.port}/synthetic-alert-endpoint`;

      await expect(
        sendAlertEvents({
          webhookUrl: receiverUrl,
          installationId: "restaurant_test",
          generatedAt: "2026-11-02T12:00:00.000Z",
          allowInsecureLoopback: true,
          events: [
            { transition: "triggered", issue: { key: "service:app", kind: "service", service: "app" } },
          ],
        }),
      ).resolves.toBe(true);

      expect(received).toHaveLength(1);
      expect(JSON.parse(received[0])).toEqual({
        installationId: "restaurant_test",
        generatedAt: "2026-11-02T12:00:00.000Z",
        events: [
          { transition: "triggered", issue: { key: "service:app", kind: "service", service: "app" } },
        ],
      });
      expect(received[0]).not.toContain(receiverUrl);
    } finally {
      server.close();
      await once(server, "close");
    }
  });

  it("rejects non-TLS alert endpoints outside loopback", async () => {
    await expect(
      sendAlertEvents({
        webhookUrl: "http://alerts.example.invalid/hook",
        installationId: "restaurant_test",
        generatedAt: "2026-11-02T12:00:00.000Z",
        events: [],
      }),
    ).rejects.toThrow("Alert webhook configuration is invalid.");
  });
});
