import { execFile as execFileCallback } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import { promisify } from "node:util";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const root = resolve(fileURLToPath(new URL("../", import.meta.url)));

function isWithin(parent, target) {
  const path = relative(resolve(parent), resolve(target));
  return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
}

export function validateArchiveSetup({ project, installationId, envFile }) {
  if (!/^[a-z][a-z0-9_]{0,23}$/.test(installationId ?? "")) throw new Error("Archive installation identifier is invalid.");
  if (!/^dosvy-[a-z0-9][a-z0-9_-]{1,62}$/.test(project ?? "")) throw new Error("Archive Compose project is invalid.");
  if (!envFile || !isAbsolute(envFile) || isWithin(root, envFile)) throw new Error("Deployment environment file must be outside the repository.");
  return true;
}

async function compose(project, envFile, args) {
  const composeFile = process.env.DOSVY_COMPOSE_FILE?.trim() ? await realpath(process.env.DOSVY_COMPOSE_FILE) : resolve(root, "deploy/compose.yaml");
  if (process.env.DOSVY_COMPOSE_FILE?.trim() && isWithin(root, composeFile)) throw new Error("Custom Compose file must be outside the repository.");
  const { stdout } = await execFile("docker", ["compose", "--project-name", project, "--env-file", envFile, "--file", composeFile, ...args], {
    cwd: root, timeout: 60_000, maxBuffer: 256 * 1024, windowsHide: true,
  });
  return stdout.trim();
}

async function deploymentValue(envFile, name) {
  const content = await readFile(envFile, "utf8");
  const line = content.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
  const value = line?.slice(name.length + 1).trim().replace(/^(?:"(.*)"|'(.*)')$/, (_match, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
  if (!value || /[\r\n]/.test(value)) throw new Error("Deployment database identity is missing.");
  return value;
}

async function assertDeploymentScope(envFile, project, installationId) {
  if (await deploymentValue(envFile, "DOSVY_COMPOSE_PROJECT") !== project ||
      await deploymentValue(envFile, "DOSVY_INSTALLATION_ID") !== installationId) {
    throw new Error("Deployment file does not match the selected installation and Compose project.");
  }
}

export async function configureArchive(environment = process.env) {
  const project = environment.DOSVY_COMPOSE_PROJECT?.trim();
  const installationId = environment.DOSVY_INSTALLATION_ID?.trim();
  const envFile = environment.DOSVY_DEPLOYMENT_ENV_FILE?.trim();
  validateArchiveSetup({ project, installationId, envFile });
  await assertDeploymentScope(envFile, project, installationId);
  const stanza = installationId;
  try {
    await compose(project, envFile, ["exec", "--no-TTY", "--user", "postgres", "postgres", "pgbackrest", `--stanza=${stanza}`, "info"]);
  } catch {
    await compose(project, envFile, ["exec", "--no-TTY", "--user", "postgres", "postgres", "pgbackrest", `--stanza=${stanza}`, "stanza-create"]);
  }
  const databaseUser = process.env.DOSVY_DATABASE_USER || await deploymentValue(envFile, "DOSVY_DATABASE_USER");
  const databaseName = process.env.DOSVY_DATABASE_NAME || await deploymentValue(envFile, "DOSVY_DATABASE_NAME");
  const psql = ["exec", "--no-TTY", "--user", "postgres", "postgres", "psql", "--no-psqlrc", "--username", databaseUser, "--dbname", databaseName, "--set", "ON_ERROR_STOP=1", "--command"];
  for (const statement of [
    "ALTER SYSTEM SET archive_mode = 'on'",
    "ALTER SYSTEM SET archive_timeout = '60s'",
    `ALTER SYSTEM SET archive_command = 'pgbackrest --stanza=${stanza} archive-push %p'`,
  ]) await compose(project, envFile, [...psql, statement]);
  await compose(project, envFile, ["restart", "postgres"]);
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const composeFile = process.env.DOSVY_COMPOSE_FILE?.trim() ? await realpath(process.env.DOSVY_COMPOSE_FILE) : resolve(root, "deploy/compose.yaml");
      const { stdout } = await execFile("docker", ["compose", "--project-name", project, "--env-file", envFile, "--file", composeFile, "ps", "--format", "json", "postgres"], {
        cwd: root, timeout: 10_000, maxBuffer: 64 * 1024, windowsHide: true,
      });
      const rows = stdout.trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
      if (rows.length === 1 && String(rows[0].Health ?? rows[0].health).toLowerCase() === "healthy") break;
    } catch {}
    await new Promise((done) => setTimeout(done, 2_000));
  }
  if (Date.now() >= deadline) throw new Error("PostgreSQL did not become healthy after archive setup.");
  await compose(project, envFile, ["exec", "--no-TTY", "--user", "postgres", "postgres", "pgbackrest", `--stanza=${stanza}`, "check"]);
  process.stdout.write(`${JSON.stringify({ event: "backup.archive.configured", installationId, project, health: "healthy" })}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  configureArchive().catch(() => {
    process.stderr.write(`${JSON.stringify({ event: "backup.archive.failed", code: "archive_setup_failed" })}\n`);
    process.exitCode = 1;
  });
}
