import { validateDeploymentTarget } from "./deployment-target.mjs";

const installationIdentifierPattern = /^[a-z][a-z0-9_]{0,23}$/;
const imageDigestPattern = /^.+@sha256:[a-f0-9]{64}$/i;

function requireValue(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function validateDomain(value) {
  const domain = requireValue(value, "A public DNS domain").toLowerCase();
  const labels = domain.split(".");
  if (
    domain.length > 253 ||
    labels.length < 2 ||
    labels.some(
      (label) =>
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  ) {
    throw new Error("A valid public DNS domain is required.");
  }
  return domain;
}

/** @param {Record<string, string | undefined>} configuration */
export function validateDeploymentConfiguration(configuration) {
  const installationId = requireValue(
    configuration.installationId,
    "An installation identifier",
  );
  if (!installationIdentifierPattern.test(installationId)) {
    throw new Error("A valid installation identifier is required.");
  }

  const composeProject = requireValue(configuration.composeProject, "A Compose project name");
  const expectedProject = `dosvy-${installationId.replaceAll("_", "-")}`;
  if (composeProject !== expectedProject) {
    throw new Error("Compose project name must match the installation identifier.");
  }

  const databaseName = requireValue(configuration.databaseName, "An installation database name");
  if (databaseName !== `dosvy_${installationId}`) {
    throw new Error("Database name must match the installation identifier.");
  }

  const databaseUser = requireValue(configuration.databaseUser, "A database user");
  const domain = validateDomain(configuration.domain);
  for (const [name, value] of [
    ["application", configuration.appImage],
    ["PostgreSQL", configuration.postgresImage],
    ["Caddy", configuration.caddyImage],
  ]) {
    if (!imageDigestPattern.test(requireValue(value, `${name} image reference`))) {
      throw new Error(`${name} image reference must be pinned by a sha256 digest.`);
    }
  }

  const password = requireValue(configuration.postgresPassword, "A PostgreSQL password file");
  const target = validateDeploymentTarget({
    databaseUrl: requireValue(configuration.databaseUrl, "A database URL file"),
    installationId,
    confirmation: installationId,
  });

  let username;
  let urlPassword;
  try {
    username = decodeURIComponent(target.username);
    urlPassword = decodeURIComponent(target.password);
  } catch {
    throw new Error("Database URL credentials must be valid URL-encoded values.");
  }
  if (username !== databaseUser || urlPassword !== password) {
    throw new Error("Database URL credentials must match the user and password files.");
  }

  return { installationId, composeProject, databaseName, domain };
}
