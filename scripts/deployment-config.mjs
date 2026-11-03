import { validateDeploymentTarget } from "./deployment-target.mjs";

const installationIdentifierPattern = /^[a-z][a-z0-9_]{0,23}$/;
const imageDigestPattern = /^.+@sha256:[a-f0-9]{64}$/i;

export function validatePgBackRestConfiguration({ contents, installationId, databaseUser }) {
  if (typeof contents !== "string" || contents.length === 0 || contents.length > 16_384) {
    throw new Error("pgBackRest configuration file is invalid.");
  }
  const values = new Map();
  let section = "global";
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const sectionMatch = /^\[([a-z0-9_-]+)\]$/i.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    const setting = /^([a-z0-9-]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!setting) throw new Error("pgBackRest configuration syntax is invalid.");
    values.set(`${section}.${setting[1]}`, setting[2]);
  }
  const required = [
    ["global.repo1-type", "s3"],
    ["global.repo1-s3-uri-style", "path"],
    ["global.repo1-storage-port", "443"],
    ["global.repo1-storage-verify-tls", "y"],
    ["global.repo1-cipher-type", "aes-256-cbc"],
    ["global.repo1-retention-full-type", "count"],
    ["global.repo1-retention-full", "2"],
    [`${installationId}.pg1-path`, "/var/lib/postgresql/18/docker"],
    [`${installationId}.pg1-user`, databaseUser],
  ];
  for (const [key, expected] of required) {
    if (values.get(key) !== expected) throw new Error("pgBackRest configuration does not meet deployment requirements.");
  }
  for (const key of ["global.repo1-s3-endpoint", "global.repo1-s3-bucket", "global.repo1-s3-key", "global.repo1-s3-key-secret", "global.repo1-cipher-pass"]) {
    const value = values.get(key);
    if (!value || /replace_with|example\.net|<|>/i.test(value)) {
      throw new Error("pgBackRest S3 credentials, endpoint, bucket and encryption key must be configured externally.");
    }
  }
  if (!contents.includes(`[${installationId}]`)) throw new Error("pgBackRest stanza must match the installation identifier.");
  return true;
}

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
