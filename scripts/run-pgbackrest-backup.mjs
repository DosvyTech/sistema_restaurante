import { execFile as execFileCallback } from "node:child_process";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { readFile, realpath, unlink } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = resolve(fileURLToPath(new URL("../", import.meta.url)));

function isWithin(parent, target) {
  const path = relative(resolve(parent), resolve(target));
  return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
}

export function validateBackupRun({ project, installationId, envFile, markerFile, failureFlagFile, type }) {
  if (!/^[a-z][a-z0-9_]{0,23}$/.test(installationId ?? "")) throw new Error("Backup installation identifier is invalid.");
  if (!/^dosvy-[a-z0-9][a-z0-9_-]{1,62}$/.test(project ?? "")) throw new Error("Backup Compose project is invalid.");
  if (!envFile || !isAbsolute(envFile) || isWithin(root, envFile)) throw new Error("Deployment environment file must be outside the repository.");
  if (!markerFile || !isAbsolute(markerFile) || isWithin(root, markerFile)) throw new Error("Backup success marker must be outside the repository.");
  if (!failureFlagFile || !isAbsolute(failureFlagFile) || isWithin(root, failureFlagFile)) throw new Error("Backup failure flag must be outside the repository.");
  if (!["full", "diff", "incr"].includes(type)) throw new Error("Backup type is invalid.");
  return true;
}

async function deploymentValue(envFile, name) {
  const content = await readFile(envFile, "utf8");
  const line = content.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
  const value = line?.slice(name.length + 1).trim().replace(/^(?:"(.*)"|'(.*)')$/, (_match, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
  if (!value || /[\r\n]/.test(value)) throw new Error("Deployment installation identity is missing.");
  return value;
}

async function compose(project, envFile, args) {
  const composeFile = process.env.DOSVY_COMPOSE_FILE?.trim() ? await realpath(process.env.DOSVY_COMPOSE_FILE) : resolve(root, "deploy/compose.yaml");
  if (process.env.DOSVY_COMPOSE_FILE?.trim() && isWithin(root, composeFile)) throw new Error("Custom Compose file must be outside the repository.");
  return execFile("docker", ["compose", "--project-name", project, "--env-file", envFile, "--file", composeFile, ...args], {
    cwd: root, timeout: 30 * 60_000, maxBuffer: 512 * 1024, windowsHide: true,
  });
}

export function findEncryptedBackup(output, expectedStanza) {
  let parsed;
  try { parsed = JSON.parse(output); } catch { throw new Error("Backup metadata is invalid."); }
  const stanza = Array.isArray(parsed) ? parsed[0] : null;
  const backups = stanza?.backup;
  if (!stanza || !Array.isArray(backups) || backups.length === 0 || stanza.status?.code !== 0) {
    throw new Error("No successful backup was recorded.");
  }
  if (expectedStanza && stanza.name !== expectedStanza) throw new Error("Backup metadata stanza does not match the selected installation.");
  const encrypted = stanza.cipher === "aes-256-cbc" || stanza.repo?.some((repo) => repo.cipher === "aes-256-cbc");
  if (!encrypted) throw new Error("Backup metadata does not confirm encryption.");
  if (backups.some((backup) => backup.error === true)) throw new Error("Backup metadata contains a failed backup.");
  return { backupCount: backups.length, cipher: "aes-256-cbc", stanza: stanza.name };
}

async function writeMarker(path, timestamp) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.tmp`;
  await writeFile(tempPath, `${timestamp}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(tempPath, path);
}

export async function writeBackupFailureFlag(path) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.tmp`;
  await writeFile(tempPath, "Backup operation failed.\n", { encoding: "utf8", mode: 0o600 });
  await rename(tempPath, path);
}

export async function clearBackupFailureFlag(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw new Error("Could not clear the backup failure status.");
  }
}

export async function runBackup(environment = process.env) {
  const project = environment.DOSVY_COMPOSE_PROJECT?.trim();
  const installationId = environment.DOSVY_INSTALLATION_ID?.trim();
  const envFile = environment.DOSVY_DEPLOYMENT_ENV_FILE?.trim();
  const markerFile = environment.DOSVY_BACKUP_LAST_SUCCESS_FILE?.trim();
  const failureFlagFile = environment.DOSVY_BACKUP_FAILURE_FLAG_FILE?.trim();
  const type = environment.DOSVY_BACKUP_TYPE?.trim() || "full";
  validateBackupRun({ project, installationId, envFile, markerFile, failureFlagFile, type });
  try {
    if (await deploymentValue(envFile, "DOSVY_COMPOSE_PROJECT") !== project ||
        await deploymentValue(envFile, "DOSVY_INSTALLATION_ID") !== installationId) {
      throw new Error("Deployment file does not match the selected installation and Compose project.");
    }
    const stanza = installationId;
    await compose(project, envFile, ["exec", "--no-TTY", "--user", "postgres", "postgres", "pgbackrest", `--stanza=${stanza}`, "check"]);
    await compose(project, envFile, ["exec", "--no-TTY", "--user", "postgres", "postgres", "pgbackrest", `--stanza=${stanza}`, "backup", `--type=${type}`]);
    const { stdout } = await compose(project, envFile, ["exec", "--no-TTY", "--user", "postgres", "postgres", "pgbackrest", `--stanza=${stanza}`, "info", "--output=json"]);
    const summary = findEncryptedBackup(stdout.trim(), stanza);
    const completedAt = new Date().toISOString();
    await writeMarker(markerFile, completedAt);
    await clearBackupFailureFlag(failureFlagFile);
    process.stdout.write(`${JSON.stringify({ event: "backup.completed", installationId, completedAt, ...summary })}\n`);
  } catch {
    await writeBackupFailureFlag(failureFlagFile);
    throw new Error("Backup operation failed.");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBackup().catch(() => {
    process.stderr.write(`${JSON.stringify({ event: "backup.failed", code: "backup_run_failed" })}\n`);
    process.exitCode = 1;
  });
}
