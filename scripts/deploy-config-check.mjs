import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { validateDeploymentConfiguration } from "./deployment-config.mjs";

function isInside(parent, candidate) {
  const pathFromParent = relative(parent, candidate);
  return (
    pathFromParent === "" ||
    (!isAbsolute(pathFromParent) &&
      pathFromParent !== ".." &&
      !pathFromParent.startsWith(`..${sep}`))
  );
}

async function readExternalSecret(pathValue, name, repositoryRoot) {
  if (!pathValue || !isAbsolute(pathValue)) {
    throw new Error(`${name} must use an absolute path outside the repository.`);
  }

  let resolvedPath;
  try {
    resolvedPath = await realpath(pathValue);
  } catch {
    throw new Error(`${name} file is unavailable.`);
  }
  if (isInside(repositoryRoot, resolvedPath)) {
    throw new Error(`${name} must remain outside the repository.`);
  }

  const fileStat = await stat(resolvedPath);
  if (!fileStat.isFile() || fileStat.size === 0 || fileStat.size > 8_192) {
    throw new Error(`${name} must be a non-empty, small regular file.`);
  }
  if (process.platform !== "win32" && (fileStat.mode & 0o077) !== 0) {
    throw new Error(`${name} permissions must be restricted to its owner (mode 0600 or stricter).`);
  }

  return (await readFile(resolvedPath, "utf8")).trim();
}

async function main() {
  const repositoryRoot = await realpath(
    fileURLToPath(new URL("../", import.meta.url)),
  );
  const databaseUrl = await readExternalSecret(
    process.env.DOSVY_DATABASE_URL_FILE,
    "Database URL secret",
    repositoryRoot,
  );
  const postgresPassword = await readExternalSecret(
    process.env.DOSVY_POSTGRES_PASSWORD_FILE,
    "PostgreSQL password secret",
    repositoryRoot,
  );
  const configuration = validateDeploymentConfiguration({
    installationId: process.env.DOSVY_INSTALLATION_ID,
    composeProject: process.env.DOSVY_COMPOSE_PROJECT,
    databaseName: process.env.DOSVY_DATABASE_NAME,
    databaseUser: process.env.DOSVY_DATABASE_USER,
    domain: process.env.DOSVY_DOMAIN,
    appImage: process.env.DOSVY_APP_IMAGE,
    postgresImage: process.env.DOSVY_POSTGRES_IMAGE,
    caddyImage: process.env.DOSVY_CADDY_IMAGE,
    databaseUrl,
    postgresPassword,
  });

  console.info(
    `Deployment configuration passed for ${configuration.installationId}; secrets are external and image references are digest-pinned.`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown configuration error";
  console.error(`Deployment configuration rejected: ${message}`);
  process.exitCode = 1;
});
