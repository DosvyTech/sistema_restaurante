import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { readFile, mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredServices = ["postgres", "app", "caddy"];

function isWithinDirectory(parent, target) {
  const relativePath = relative(resolve(parent), resolve(target));
  return relativePath === "" || (relativePath !== ".." && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath));
}

function parseComposeRows(output) {
  const trimmed = output.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  }
}

export function normalizeComposeServices(output) {
  return parseComposeRows(output)
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      service: String(row.Service ?? row.service ?? "").trim(),
      state: String(row.State ?? row.state ?? "unknown").trim().toLowerCase(),
      health: String(row.Health ?? row.health ?? "unknown").trim().toLowerCase(),
    }))
    .filter(({ service }) => service.length > 0)
    .sort((left, right) => left.service.localeCompare(right.service));
}

function toTimestamp(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const timestamp = Date.parse(value.trim());
    return Number.isFinite(timestamp) ? timestamp : null;
  }
  return null;
}

function collectAgeIssue(key, kind, value, maxAgeMs, now) {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return { key, kind, reason: "missing" };
  if (timestamp > now || now - timestamp > maxAgeMs) {
    return { key, kind, reason: timestamp > now ? "invalid" : "stale" };
  }
  return null;
}

export function collectOperationalIssues(services, options = {}) {
  const expected = options.requiredServices ?? requiredServices;
  const now = options.now ?? Date.now();
  const byService = new Map();
  for (const service of services) {
    const entries = byService.get(service.service) ?? [];
    entries.push(service);
    byService.set(service.service, entries);
  }

  const issues = [];
  if (options.backupFailed === true) {
    issues.push({ key: "backup:failed", kind: "backup", reason: "failed" });
  }
  for (const service of [...expected].sort()) {
    const entries = byService.get(service) ?? [];
    if (entries.length === 0) {
      issues.push({ key: `service:${service}`, kind: "service", service, state: "missing", health: "unknown" });
      continue;
    }
    if (entries.some(({ state, health }) => state !== "running" || health !== "healthy")) {
      const failing = entries.find(({ state, health }) => state !== "running" || health !== "healthy");
      issues.push({
        key: `service:${service}`,
        kind: "service",
        service,
        state: failing.state,
        health: failing.health,
      });
    }
  }

  const backupIssue = collectAgeIssue(
    "backup:stale",
    "backup",
    options.backupLastSuccessAt,
    options.backupMaxAgeMs ?? 36 * 60 * 60 * 1000,
    now,
  );
  if (backupIssue) issues.push(backupIssue);

  const walIssue = collectAgeIssue(
    "wal:stale",
    "wal",
    options.walLastArchivedAt,
    options.walMaxAgeMs ?? 15 * 60 * 1000,
    now,
  );
  if (walIssue) issues.push(walIssue);

  return issues.sort((left, right) => left.key.localeCompare(right.key));
}

export function diffOperationalIssues(previousIssues, currentIssues) {
  const previous = new Map(previousIssues.map((issue) => [issue.key, issue]));
  const current = new Map(currentIssues.map((issue) => [issue.key, issue]));
  const events = [];

  for (const issue of previous.values()) {
    if (!current.has(issue.key)) events.push({ transition: "recovered", issue });
  }
  for (const issue of current.values()) {
    if (!previous.has(issue.key)) events.push({ transition: "triggered", issue });
  }

  return events.sort((left, right) => {
    const transitionOrder = left.transition.localeCompare(right.transition);
    return transitionOrder || left.issue.key.localeCompare(right.issue.key);
  });
}

function sanitizeIssue(issue) {
  if (issue.kind === "service") {
    return {
      key: issue.key,
      kind: "service",
      service: issue.service,
      state: issue.state,
      health: issue.health,
    };
  }
  return { key: issue.key, kind: issue.kind, reason: issue.reason };
}

function isLoopback(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}

function validateWebhookUrl(webhookUrl, allowInsecureLoopback) {
  const url = new URL(webhookUrl);
  const localHttpAllowed =
    allowInsecureLoopback && url.protocol === "http:" && isLoopback(url.hostname);
  if ((url.protocol !== "https:" && !localHttpAllowed) || url.username || url.password) {
    throw new Error("Alert webhook configuration is invalid.");
  }
  return url;
}

export async function sendAlertEvents({
  webhookUrl,
  installationId,
  generatedAt,
  events,
  allowInsecureLoopback = false,
  fetchImplementation = globalThis.fetch,
}) {
  const url = validateWebhookUrl(webhookUrl, allowInsecureLoopback);
  if (typeof fetchImplementation !== "function") throw new Error("Alert webhook configuration is invalid.");

  const payload = {
    installationId,
    generatedAt,
    events: events.map(({ transition, issue }) => ({ transition, issue: sanitizeIssue(issue) })),
  };
  const response = await fetchImplementation(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Alert webhook returned HTTP ${response.status}.`);
  return true;
}

async function readRequiredExternalFile(path, label) {
  assertExternalPath(path, label);
  return (await readFile(path, "utf8")).trim();
}

async function readOptionalExternalFile(path) {
  assertExternalPath(path, "Backup success marker file");
  try {
    return (await readFile(path, "utf8")).trim();
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw new Error("Could not read the backup success marker.");
  }
}

async function fileExists(path) {
  assertExternalPath(path, "Backup failure flag file");
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw new Error("Could not read the backup failure status.");
  }
}

function assertExternalPath(path, label) {
  if (!path || !isAbsolute(path) || isWithinDirectory(repositoryRoot, path)) {
    throw new Error(`${label} must be an absolute path outside the repository.`);
  }
}

async function loadState(path) {
  try {
    const parsed = JSON.parse(await readRequiredExternalFile(path, "Alert state file"));
    if (!Array.isArray(parsed.issues)) throw new Error("Invalid state.");
    return parsed.issues;
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw new Error("Could not read alert state.");
  }
}

async function saveState(path, issues) {
  if (!isAbsolute(path) || isWithinDirectory(repositoryRoot, path)) {
    throw new Error("Alert state file must be an absolute path outside the repository.");
  }
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify({ issues })}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, path);
}

function requireEnv(name, environment) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Required monitor setting ${name} is missing.`);
  return value;
}

function parseMinutes(name, defaultValue, environment) {
  const value = environment[name]?.trim();
  if (!value) return defaultValue;
  const minutes = Number(value);
  if (!Number.isSafeInteger(minutes) || minutes < 1) throw new Error(`Monitor setting ${name} is invalid.`);
  return minutes;
}

export function createWalArchiveStatusCommand() {
  return 'psql --no-psqlrc --tuples-only --no-align --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --command "SELECT COALESCE(EXTRACT(EPOCH FROM max(last_archived_time))::bigint::text, \'\') FROM pg_stat_archiver;"';
}

async function runDockerCompose(project, envFile, composeFile, args) {
  try {
    const { stdout } = await execFile(
      "docker",
      ["compose", "--project-name", project, "--env-file", envFile, "--file", composeFile, ...args],
      { encoding: "utf8", timeout: 15_000, maxBuffer: 256 * 1024, windowsHide: true },
    );
    return stdout.trim();
  } catch {
    throw new Error("Docker Compose status could not be read.");
  }
}

async function readWalArchivedAt(project, envFile, composeFile) {
  try {
    const value = await runDockerCompose(project, envFile, composeFile, [
      "exec",
      "--no-TTY",
      "--user",
      "postgres",
      "postgres",
      "sh",
      "-ec",
      createWalArchiveStatusCommand(),
    ]);
    const epochSeconds = Number(value);
    return Number.isFinite(epochSeconds) && epochSeconds > 0 ? epochSeconds * 1000 : null;
  } catch {
    return null;
  }
}

function outputEvent(event) {
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

export async function runMonitor(environment = process.env) {
  const project = environment.DOSVY_COMPOSE_PROJECT?.trim();
  const installationId = environment.DOSVY_INSTALLATION_ID?.trim();
  if (!project || !/^[a-z0-9][a-z0-9_-]{1,62}$/.test(project)) {
    throw new Error("Monitor project name is invalid.");
  }
  if (!installationId || !/^[a-z0-9][a-z0-9_-]{1,62}$/.test(installationId)) {
    throw new Error("Monitor installation identifier is invalid.");
  }

  const envFile = requireEnv("DOSVY_DEPLOYMENT_ENV_FILE", environment);
  const composeFile = resolve(environment.DOSVY_COMPOSE_FILE ?? "deploy/compose.yaml");
  const stateFile = requireEnv("DOSVY_ALERT_STATE_FILE", environment);
  const markerFile = requireEnv("DOSVY_BACKUP_LAST_SUCCESS_FILE", environment);
  const failureFlagFile = requireEnv("DOSVY_BACKUP_FAILURE_FLAG_FILE", environment);
  const webhookFile = requireEnv("DOSVY_ALERT_WEBHOOK_FILE", environment);
  assertExternalPath(envFile, "Deployment environment file");
  assertExternalPath(stateFile, "Alert state file");
  assertExternalPath(markerFile, "Backup success marker file");
  assertExternalPath(failureFlagFile, "Backup failure flag file");
  const webhookUrl = await readRequiredExternalFile(webhookFile, "Alert webhook file");
  validateWebhookUrl(webhookUrl, environment.DOSVY_TEST_ALLOW_INSECURE_WEBHOOK === "1");
  const composeOutput = await runDockerCompose(project, envFile, composeFile, ["ps", "--format", "json"]);
  const services = normalizeComposeServices(composeOutput);
  const [backupLastSuccessAt, backupFailed, walLastArchivedAt, previousIssues] = await Promise.all([
    readOptionalExternalFile(markerFile),
    fileExists(failureFlagFile),
    readWalArchivedAt(project, envFile, composeFile),
    loadState(stateFile),
  ]);
  const now = Date.now();
  const currentIssues = collectOperationalIssues(services, {
    backupLastSuccessAt,
    backupFailed,
    backupMaxAgeMs: parseMinutes("DOSVY_BACKUP_MAX_AGE_MINUTES", 36 * 60, environment) * 60_000,
    walLastArchivedAt,
    walMaxAgeMs: parseMinutes("DOSVY_WAL_MAX_AGE_MINUTES", 15, environment) * 60_000,
    now,
  });
  const events = diffOperationalIssues(previousIssues, currentIssues);

  if (events.length > 0) {
    await sendAlertEvents({
      webhookUrl,
      installationId,
      generatedAt: new Date(now).toISOString(),
      events,
      allowInsecureLoopback: environment.DOSVY_TEST_ALLOW_INSECURE_WEBHOOK === "1",
    });
  }

  await saveState(stateFile, currentIssues);
  outputEvent({
    event: "deployment.monitor.completed",
    installationId,
    state: currentIssues.length === 0 ? "healthy" : "degraded",
    activeIssueCount: currentIssues.length,
    transitionsSent: events.length,
    generatedAt: new Date(now).toISOString(),
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMonitor().catch(() => {
    outputEvent({ event: "deployment.monitor.failed", code: "monitor_run_failed" });
    process.exitCode = 1;
  });
}
