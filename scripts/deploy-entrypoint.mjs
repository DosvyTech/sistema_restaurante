import { readFile } from "node:fs/promises";

import { validateDeploymentTarget } from "./deployment-target.mjs";

async function start() {
  let databaseUrl;
  try {
    databaseUrl = (await readFile("/run/secrets/database_url", "utf8")).trim();
  } catch {
    throw new Error("Deployment database URL secret is unavailable.");
  }

  const installationId = process.env.DOSVY_INSTALLATION_ID ?? "";
  const target = validateDeploymentTarget({
    databaseUrl,
    installationId,
    confirmation: installationId,
  });

  process.env.DATABASE_URL = target.toString();
  await import("../server.js");
}

start().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown startup error";
  console.error(`Application startup failed: ${message}`);
  process.exitCode = 1;
});
