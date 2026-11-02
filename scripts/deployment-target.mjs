const installationIdentifierPattern = /^[a-z][a-z0-9_]{0,23}$/;

/**
 * Validate the destination before a deployment migration is allowed to connect.
 * This service is only intended to run on the private Compose network.
 * @param {{databaseUrl: string, installationId: string, confirmation: string}} input
 * @returns {URL}
 */
export function validateDeploymentTarget(input) {
  const { databaseUrl, installationId, confirmation } = input;

  if (!installationIdentifierPattern.test(installationId)) {
    throw new Error("A valid deployment installation identifier is required.");
  }

  if (confirmation !== installationId) {
    throw new Error("Deployment migration confirmation must match the installation identifier.");
  }

  let target;
  try {
    target = new URL(databaseUrl);
  } catch {
    throw new Error("A valid database URL with installation credentials is required.");
  }

  if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    !target.username ||
    !target.password ||
    target.hostname.toLowerCase() !== "postgres" ||
    (target.port && target.port !== "5432")
  ) {
    throw new Error("Database URL must target the private postgres service with credentials.");
  }

  let name;
  try {
    name = decodeURIComponent(target.pathname.slice(1));
  } catch {
    throw new Error("Database URL must identify the installation database.");
  }

  if (name !== `dosvy_${installationId}`) {
    throw new Error("Database URL must identify the installation database.");
  }

  return target;
}
