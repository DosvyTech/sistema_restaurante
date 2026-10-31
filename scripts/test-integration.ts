import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const image = "postgres:18.6-alpine";
const changeLabel = "com.dosvy.change";
const runLabel = "com.dosvy.run-id";
const projectRoot = process.cwd();
const simulateFailure = process.argv.includes("--simulate-failure-after-ready");

function run(command: string, args: string[], env = process.env) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: 10 * 60 * 1000,
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    const suffix = result.signal ? ` (${result.signal})` : "";
    throw new Error(`${command} ${args[0] ?? ""} failed${suffix}.`);
  }

  return result.stdout.trim();
}

function docker(args: string[]) {
  return run("docker", args);
}

function readDocker(command: string, args: string[]): string {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: 30_000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) return "";
  return result.stdout.trim();
}

function listContainerIds(): string[] {
  return readDocker("docker", ["ps", "--all", "--quiet", "--no-trunc"])
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
}

function listVolumeNames(): string[] {
  return readDocker("docker", ["volume", "ls", "--quiet"]).split(/\r?\n/).filter(Boolean).sort();
}

function protectedResourceState() {
  return {
    containers: listContainerIds(),
    volumes: listVolumeNames(),
    chg003Container: readDocker("docker", [
      "inspect",
      "--format",
      "{{.Id}}|{{.State.Status}}",
      "dosvy-chg003-postgres",
    ]),
    chg003Volume: readDocker("docker", [
      "volume",
      "inspect",
      "--format",
      "{{.Name}}|{{.CreatedAt}}|{{.Driver}}",
      "dosvy_chg003_pgdata",
    ]),
  };
}

function integrationEnvironment(
  port: number,
  password: string,
  inherited: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...inherited };
  for (const key of Object.keys(env)) {
    if (
      /^(DATABASE_URL|TEST_DATABASE_URL|DATABASE_URI|TEST_DATABASE_URI|PG[A-Z0-9_]*|POSTGRES_[A-Z0-9_]*|SUPABASE_DB_URL|NODE_OPTIONS)$/i.test(
        key,
      )
    ) {
      delete env[key];
    }
  }

  const user = "dosvy_test";
  const makeUrl = (database: string) =>
    `postgresql://${user}:${password}@127.0.0.1:${port}/${database}`;

  return {
    ...env,
    CI: "1",
    NODE_ENV: "test",
    NEXT_TELEMETRY_DISABLED: "1",
    DATABASE_URL: makeUrl("dosvy_dev"),
    TEST_DATABASE_URL: makeUrl("dosvy_test"),
    PGHOST: "127.0.0.1",
    PGPORT: String(port),
    PGUSER: user,
    PGPASSWORD: password,
    PGDATABASE: "dosvy_test",
    POSTGRES_USER: user,
    POSTGRES_PASSWORD: password,
    POSTGRES_DB: "dosvy_test",
  };
}

async function waitUntilReady(containerId: string, user: string): Promise<void> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const result = spawnSync(
      "docker",
      ["exec", containerId, "pg_isready", "-U", user, "-d", "dosvy_test"],
      { cwd: projectRoot, encoding: "utf8", timeout: 10_000, windowsHide: true },
    );
    if (!result.error && result.status === 0) return;
    await delay(1_000);
  }

  throw new Error("Temporary PostgreSQL did not become ready within 90 seconds.");
}

function assertExpectedMounts(containerId: string): void {
  const rawMounts = docker(["inspect", "--format", "{{json .Mounts}}", containerId]);
  const mounts = JSON.parse(rawMounts) as Array<{
    Type?: string;
    Destination?: string;
  }>;
  const rawTmpfs = docker([
    "inspect",
    "--format",
    "{{json .HostConfig.Tmpfs}}",
    containerId,
  ]);
  const tmpfs = JSON.parse(rawTmpfs) as Record<string, string>;
  if (
    mounts.some(
      (mount) =>
        mount.Type !== "tmpfs" || mount.Destination !== "/var/lib/postgresql",
    ) ||
    Object.keys(tmpfs).length !== 1 ||
    !/^rw(?:,|$)/.test(tmpfs["/var/lib/postgresql"] ?? "")
  ) {
    throw new Error("Temporary PostgreSQL has an unexpected persistent mount.");
  }
}

function resolveMappedPort(containerId: string): number {
  const mapping = docker(["port", containerId, "5432/tcp"]);
  const match = mapping.match(/^127\.0\.0\.1:(\d+)$/m);
  const port = Number(match?.[1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Temporary PostgreSQL did not receive a loopback-only port.");
  }
  return port;
}

async function main(): Promise<void> {
  const runId = randomUUID().replaceAll("-", "");
  const containerName = `dosvy-chg004-test-${runId}`;
  const password = randomBytes(32).toString("hex");
  const before = protectedResourceState();
  let containerId: string | undefined;
  let runError: unknown;
  let cleanupConfirmed = false;

  try {
    const createdId = docker([
      "run",
      "--detach",
      "--name",
      containerName,
      "--label",
      `${changeLabel}=chg-004-establish-testing-infrastructure`,
      "--label",
      `${runLabel}=${runId}`,
      "--env",
      "POSTGRES_USER=dosvy_test",
      "--env",
      `POSTGRES_PASSWORD=${password}`,
      "--env",
      "POSTGRES_DB=dosvy_test",
      "--publish",
      "127.0.0.1::5432",
      "--tmpfs",
      "/var/lib/postgresql:rw,size=1073741824",
      image,
    ]);
    containerId = createdId;

    const owner = docker([
      "inspect",
      "--format",
      `{{ index .Config.Labels "${changeLabel}" }}|{{ index .Config.Labels "${runLabel}" }}`,
      containerId,
    ]);
    if (owner !== `chg-004-establish-testing-infrastructure|${runId}`) {
      throw new Error("Temporary container ownership labels did not match this run.");
    }

    assertExpectedMounts(containerId);
    const port = resolveMappedPort(containerId);
    await waitUntilReady(containerId, "dosvy_test");
    console.log(`Temporary PostgreSQL is ready on 127.0.0.1:${port}.`);

    if (simulateFailure) {
      throw new Error("Controlled failure requested after PostgreSQL readiness.");
    }

    const npmCli = process.env.npm_execpath;
    if (!npmCli) throw new Error("npm_execpath is unavailable; cannot run db:verify.");
    const childEnv = integrationEnvironment(port, password);
    const result = spawnSync(process.execPath, [npmCli, "run", "db:verify"], {
      cwd: projectRoot,
      env: childEnv,
      stdio: "inherit",
      timeout: 10 * 60 * 1000,
      windowsHide: true,
    });
    if (result.error || result.status !== 0) {
      throw new Error(
        `npm run db:verify failed (exit ${result.status ?? result.signal ?? "unknown"}).`,
      );
    }
  } catch (error) {
    runError = error;
  } finally {
    if (!containerId) {
      const candidate = readDocker("docker", [
        "inspect",
        "--format",
        `{{.Id}}|{{ index .Config.Labels "${changeLabel}" }}|{{ index .Config.Labels "${runLabel}" }}`,
        containerName,
      ]);
      const [candidateId, owner, candidateRunId] = candidate.split("|");
      if (
        candidateId &&
        owner === "chg-004-establish-testing-infrastructure" &&
        candidateRunId === runId
      ) {
        containerId = candidateId;
      }
    }

    if (containerId) {
      const owner = readDocker("docker", [
        "inspect",
        "--format",
        `{{ index .Config.Labels "${changeLabel}" }}|{{ index .Config.Labels "${runLabel}" }}`,
        containerId,
      ]);
      if (owner === `chg-004-establish-testing-infrastructure|${runId}`) {
        const cleanup = spawnSync("docker", ["rm", "--force", "--volumes", containerId], {
          cwd: projectRoot,
          encoding: "utf8",
          timeout: 30_000,
          windowsHide: true,
        });
        if (cleanup.error || cleanup.status !== 0) {
          runError ??= new Error("The temporary PostgreSQL container cleanup failed.");
        }
      } else {
        runError ??= new Error("Refused cleanup because container ownership could not be verified.");
      }
    }

    const after = protectedResourceState();
    const expectedContainers = before.containers.filter((id) => id !== containerId);
    if (
      JSON.stringify(after.containers) !== JSON.stringify(expectedContainers.sort()) ||
      JSON.stringify(after.volumes) !== JSON.stringify(before.volumes) ||
      after.chg003Container !== before.chg003Container ||
      after.chg003Volume !== before.chg003Volume
    ) {
      runError ??= new Error("Docker resources outside this run changed during integration tests.");
    } else if (containerId) {
      cleanupConfirmed = true;
    }
  }

  if (cleanupConfirmed) {
    console.log("Temporary PostgreSQL container and disposable storage were removed.");
    console.log("CHG-003 container, volume, and all pre-existing Docker containers are unchanged.");
  }

  if (runError) {
    process.exitCode = 1;
    const message = runError instanceof Error ? runError.message : "Unknown integration error.";
    console.error(`Integration test setup failed: ${message}`);
    return;
  }

}

void main().catch(() => {
  console.error("Integration test setup failed unexpectedly.");
  process.exitCode = 1;
});
